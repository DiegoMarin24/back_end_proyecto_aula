import { Request, Response } from 'express';
import { AssetStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { category, status, search } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.status = status as AssetStatus;
    if (search) {
      where.OR = [
        { name:         { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { location:     { contains: search, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener activos' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: { tickets: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    if (!asset) { res.status(404).json({ error: 'Activo no encontrado' }); return; }
    res.json(asset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener activo' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, category, serialNumber, status, location, purchaseDate, value, assignedTo } = req.body as {
      name: string; category: string; serialNumber: string; status?: AssetStatus;
      location: string; purchaseDate: string; value: number; assignedTo?: string;
    };

    if (!name || !category || !serialNumber || !location || !purchaseDate || value === undefined) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }

    const asset = await prisma.asset.create({
      data: {
        name, category, serialNumber,
        status: status ?? 'available',
        location,
        purchaseDate: new Date(purchaseDate),
        value: parseFloat(String(value)),
        assignedTo,
      },
    });
    res.status(201).json(asset);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      res.status(400).json({ error: 'El número de serie ya existe' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear activo' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { name, category, serialNumber, status, location, purchaseDate, value, assignedTo } = req.body as Partial<{
      name: string; category: string; serialNumber: string; status: AssetStatus;
      location: string; purchaseDate: string; value: number; assignedTo: string;
    }>;

    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...(name         && { name }),
        ...(category     && { category }),
        ...(serialNumber && { serialNumber }),
        ...(status       && { status }),
        ...(location     && { location }),
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
        ...(value !== undefined && { value: parseFloat(String(value)) }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });
    res.json(asset);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === 'P2025') { res.status(404).json({ error: 'Activo no encontrado' }); return; }
    if (e.code === 'P2002') { res.status(400).json({ error: 'El número de serie ya existe' }); return; }
    res.status(500).json({ error: 'Error al actualizar activo' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ message: 'Activo eliminado correctamente' });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Activo no encontrado' });
      return;
    }
    res.status(500).json({ error: 'Error al eliminar activo' });
  }
}
