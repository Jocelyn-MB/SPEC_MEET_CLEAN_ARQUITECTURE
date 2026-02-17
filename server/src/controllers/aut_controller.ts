import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from "../config/prisma";
import { loginSchema, registerSchema } from "../utils/validation";
import crypto from 'crypto';

export const register = async (req: Request, res: Response) : Promise<void> =>{
    try {
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success){
            res.status(400).json({
                error: "Datos invalidos",
                details: validation.error.format()
            });
            return;
        }

        const {email, password, name} = validation.data;
        const existingUser = await prisma.user.findUnique({
            where: {email}
        });

        if (existingUser) {
            res.status(409).json({error: "El correo ya se esta usando en otra cuenta"});
            return;
        } 

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: "CLIENT",
            },
        });

        res.status(201).json({
            message: "Registro realizado con exito",
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
        });
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Error al Realizar el registro"});
    }
};

// * ---------------------------FUNCION PARA EL LOGIN DEL USUARIO----------------------------------------------------------

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success){
            res.status(400).json({
                error: "Datos Invalidos",
                details: validation.error.format()
            });
            return;
        }

        const {email, password} = validation.data;
        const {rememberMe} = req.body;
        const user = await prisma.user.findUnique({
            where: {email},
        });

        if(!user || !(await bcrypt.compare(password, user.password))){
            res.status(401).json({error: "Credenciales Invalidas, revise los datos"});
            return;
        }
        const expiresIn = rememberMe ? '30d': '1d';
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        const token = jwt.sign(
            {userId: user.id, role: user.role},
            process.env.JWT_SECRET as string,
            {expiresIn}
        );
        console.log("Send cookie auth_token");

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: maxAge
        });
        
        res.json({
            message: "Login exitoso",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        });
        
    } catch(error){
        console.error(error);
        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.sendStatus(200);
};

export const verifySession = (req: Request, res: Response) =>{
    res.json(req.user);
};

export const forgotPassowrd = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email} = req.body;
        const user = await prisma.user.findUnique({where: {email}});

        if (!user) {
            res.status(200).json({message: "Si el correo esta registrado, recibiras un enlace."});
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date(Date.now() + 3600000);
        
        await prisma.user.update({
            where: {id: user.id},
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpired: resetPasswordExpires
            }
        });

        //TODO: CUANDO ESTE EL CORREO OFICIAL LO CAMBIAMOS AQUI
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        console.log("-------------------------------------------");
        console.log("SIMULANDO CORREO");
        console.log(`Para: ${email}`);
        console.log(`Link: ${resetUrl}`);
        console.log("----------------------------------------------------");

        res.json({message: "Si el correo esta registrado, recibiras un enlace"})
    } catch (error){
        console.error(error);
        res.status(500).json({error: "Error al procesar la solicitud"})
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params; // El token viene en la URL
        const { newPassword } = req.body;

        // Buscar usuario que tenga ese token Y que el token no haya expirado
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpired: { gt: new Date() } // gt = greater than (mayor que ahora)
            }
        });

        if (!user) {
            res.status(400).json({ error: "El enlace es inválido o ha expirado" });
            return;
        }

        // Encriptar la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar usuario y BORRAR el token (para que no se use dos veces)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpired: null
            }
        });

        res.json({ message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al restablecer contraseña" });
    }
};