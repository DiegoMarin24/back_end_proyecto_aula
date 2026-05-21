import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) { res.status(400).json({ error: 'Email y contraseña son requeridos' }); return; }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { res.status(401).json({ error: 'Credenciales incorrectas' }); return; }

    const match = await bcrypt.compare(password, user.password);
    if (!match) { res.status(401).json({ error: 'Credenciales incorrectas' }); return; }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      (process.env.JWT_SECRET || 'secret') as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    if (!name || !email || !password) { res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' }); return; }
    if (password.length < 6) { res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' }); return; }

    const hashed = await bcrypt.hash(password, 10);
    const user   = await prisma.user.create({
      data: { name, email, password: hashed, role: 'user' },
      select: { id: true, name: true, email: true, role: true },
    });
    res.status(201).json({ message: 'Cuenta creada exitosamente', user });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') { res.status(400).json({ error: 'El correo ya está registrado' }); return; }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
