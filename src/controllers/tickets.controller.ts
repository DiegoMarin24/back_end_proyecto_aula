import { Request, Response } from 'express';
import { TicketStatus, TicketPriority } from '@prisma/client';
import prisma from '../lib/prisma';

const ticketInclude = {
  asset:      { select: { id: true, name: true } },
  createdBy:  { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
};

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status, priority, category, search } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};

    // Usuario normal solo ve sus propios tickets
    if (req.user.role === 'user') where.createdById = req.user.id;

    if (status   && status   !== 'all') where.status   = status as TicketStatus;
    if (priority && priority !== 'all') where.priority = priority as TicketPriority;
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.ticket.findMany({ where, include: ticketInclude, orderBy: { createdAt: 'desc' } });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: ticketInclude });
    if (!ticket) { res.status(404).json({ error: 'Ticket no encontrado' }); return; }
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, priority, category, assetId, assignedToId } = req.body as {
      title: string; description: string; priority?: TicketPriority;
      category: string; assetId?: string; assignedToId?: string;
    };

    if (!title || !description || !category) {
      res.status(400).json({ error: 'Faltan campos requeridos: title, description, category' });
      return;
    }

    const ticket = await prisma.ticket.create({
      data: {
        title, description, category,
        priority:    priority ?? 'medium',
        status:      'open',
        createdById: req.user.id,
        ...(assetId      && { assetId }),
        ...(assignedToId && { assignedToId }),
      },
      include: ticketInclude,
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear ticket' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, status, priority, category, assetId, assignedToId } = req.body as Partial<{
      title: string; description: string; status: TicketStatus;
      priority: TicketPriority; category: string; assetId: string; assignedToId: string;
    }>;

    const data: Record<string, unknown> = {};
    if (title)       data.title       = title;
    if (description) data.description = description;
    if (status)      data.status      = status;
    if (priority)    data.priority    = priority;
    if (category)    data.category    = category;
    if (assetId      !== undefined) data.assetId      = assetId      || null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (status === 'resolved' || status === 'closed') data.resolvedAt = new Date();

    const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data, include: ticketInclude });
    res.json(ticket);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await prisma.ticket.delete({ where: { id: req.params.id } });
    res.json({ message: 'Ticket eliminado correctamente' });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }
    res.status(500).json({ error: 'Error al eliminar ticket' });
  }
}
