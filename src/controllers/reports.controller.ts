import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getSummary(_req: Request, res: Response): Promise<void> {
  try {
    const [totalAssets, totalTickets, totalUsers, assetsValue] = await Promise.all([
      prisma.asset.count(),
      prisma.ticket.count(),
      prisma.user.count(),
      prisma.asset.aggregate({ _sum: { value: true } }),
    ]);

    const [assetsByStatus, ticketsByStatus, ticketsByPriority, ticketsByCategory, assetsByCategory] = await Promise.all([
      prisma.asset.groupBy({ by: ['status'],   _count: { status: true } }),
      prisma.ticket.groupBy({ by: ['status'],   _count: { status: true } }),
      prisma.ticket.groupBy({ by: ['priority'], _count: { priority: true } }),
      prisma.ticket.groupBy({ by: ['category'], _count: { category: true } }),
      prisma.asset.groupBy({ by: ['category'], _count: { category: true } }),
    ]);

    const recentTickets = await prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        asset:     { select: { name: true } },
      },
    });

    res.json({
      summary: {
        totalAssets,
        totalTickets,
        totalUsers,
        totalInventoryValue: assetsValue._sum.value ?? 0,
      },
      assetsByStatus:    assetsByStatus.map(s => ({ status: s.status, count: s._count.status })),
      ticketsByStatus:   ticketsByStatus.map(s => ({ status: s.status, count: s._count.status })),
      ticketsByPriority: ticketsByPriority.map(p => ({ priority: p.priority, count: p._count.priority })),
      ticketsByCategory: ticketsByCategory.map(c => ({ category: c.category, count: c._count.category })),
      assetsByCategory:  assetsByCategory.map(c => ({ category: c.category, count: c._count.category })),
      recentTickets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
}
