import { NextFunction, Request, Response } from "express";
import jwt  from 'jsonwebtoken';

interface TokenPayload {
    userId: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}


export const authenticateToken = (req: Request, res: Response, next: NextFunction) =>{
    console.log("LLEGUE AL MIDDLEWARE NUEVO - VERSION FINAL 🔥");
    console.log("Cookies recibidas:", req.cookies);
    const token = req.cookies['auth_token'];

    if(!token){
        res.status(401).json({error: 'Acceso denegado Token no proporcionado correctamente'});
        return;
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = verified as TokenPayload;
+       next();
    } catch(error){
        res.status(403).json({error: 'Token invalido o expirado'});
        return;
    }
};