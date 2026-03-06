import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { loginSchema, registerSchema } from '../utils/validation';
import { sendPasswordResetEmail } from '../services/email.service';

// ============================================================
// POST /api/auth/register
// ============================================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Datos inválidos', details: validation.error.format() });
      return;
    }

    const { email, password, name } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'El correo ya está registrado en otra cuenta' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: 'CLIENT' },
    });

    res.status(201).json({
      message: 'Registro exitoso',
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error al realizar el registro' });
  }
};

// ============================================================
// POST /api/auth/login
// ============================================================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Datos inválidos', details: validation.error.format() });
      return;
    }

    const { email, password } = validation.data;
    const { rememberMe } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Cuenta desactivada. Contacta al administrador.' });
      return;
    }

    const expiresIn = rememberMe ? '30d' : '1d';
    const maxAge   = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    res.json({
      message: 'Login exitoso',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================================
// POST /api/auth/logout
// ============================================================
export const logout = (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.sendStatus(200);
};

// ============================================================
// GET /api/auth/verify
// ============================================================
export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) { res.status(401).json({ error: 'Usuario no encontrado' }); return; }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error verificando sesión' });
  }
};

// ============================================================
// POST /api/auth/forgot-password
// ============================================================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Siempre respondemos igual (evitar enumerar emails)
    if (!user) {
      res.json({ message: 'Si el correo está registrado, recibirás un enlace.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpired: resetExpires },
    });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Enviar email REAL
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.json({ message: 'Si el correo está registrado, recibirás un enlace.' });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// ============================================================
// POST /api/auth/reset-password/:token
// ============================================================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { resetPasswordToken: token, resetPasswordExpired: { gt: new Date() } },
    });

    if (!user) {
      res.status(400).json({ error: 'El enlace es inválido o ha expirado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpired: null },
    });

    res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};