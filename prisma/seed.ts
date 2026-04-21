import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword  = await bcrypt.hash('user123', 10);
  const techPassword  = await bcrypt.hash('tech123', 10);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@assetflow.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@assetflow.com', password: adminPassword, role: 'admin' },
  });

  const tecnico = await prisma.user.upsert({
    where:  { email: 'tech@assetflow.com' },
    update: {},
    create: { name: 'Técnico', email: 'tech@assetflow.com', password: techPassword, role: 'tecnico' },
  });

  const usuario = await prisma.user.upsert({
    where:  { email: 'user@assetflow.com' },
    update: {},
    create: { name: 'Usuario', email: 'user@assetflow.com', password: userPassword, role: 'user' },
  });

  console.log('✅ Usuarios:', admin.email, tecnico.email, usuario.email);

  const assets = await Promise.all([
    prisma.asset.upsert({
      where:  { serialNumber: 'DL-2023-001' },
      update: {},
      create: { name: 'Dell Latitude 5520', category: 'Laptop', serialNumber: 'DL-2023-001', status: 'in_use', location: 'Oficina Principal - Piso 3', purchaseDate: new Date('2023-01-15'), value: 1200, assignedTo: 'Juan Pérez' },
    }),
    prisma.asset.upsert({
      where:  { serialNumber: 'HP-2023-045' },
      update: {},
      create: { name: 'HP LaserJet Pro', category: 'Impresora', serialNumber: 'HP-2023-045', status: 'available', location: 'Sala de Impresión', purchaseDate: new Date('2023-03-20'), value: 450 },
    }),
    prisma.asset.upsert({
      where:  { serialNumber: 'IP-2023-120' },
      update: {},
      create: { name: 'iPhone 13 Pro', category: 'Móvil', serialNumber: 'IP-2023-120', status: 'in_use', location: 'Oficina Principal - Piso 2', purchaseDate: new Date('2023-02-10'), value: 1100, assignedTo: 'María García' },
    }),
    prisma.asset.upsert({
      where:  { serialNumber: 'MB-2023-034' },
      update: {},
      create: { name: 'MacBook Pro 16"', category: 'Laptop', serialNumber: 'MB-2023-034', status: 'in_use', location: 'Oficina Principal - Piso 4', purchaseDate: new Date('2023-05-12'), value: 2800, assignedTo: 'Carlos Rodríguez' },
    }),
    prisma.asset.upsert({
      where:  { serialNumber: 'RC-2022-089' },
      update: {},
      create: { name: 'Router Cisco RV340', category: 'Red', serialNumber: 'RC-2022-089', status: 'in_use', location: 'Sala de Servidores', purchaseDate: new Date('2022-11-20'), value: 600 },
    }),
  ]);

  console.log('✅ Activos creados:', assets.length);

  await prisma.ticket.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Laptop no enciende', description: 'La laptop Dell Latitude no enciende después de un apagado inesperado.', status: 'in_progress', priority: 'high', category: 'Hardware', assetId: assets[0].id, createdById: usuario.id, assignedToId: tecnico.id },
      { title: 'Solicitud de monitor adicional', description: 'Necesito un monitor adicional para trabajar con múltiples aplicaciones.', status: 'open', priority: 'low', category: 'Solicitud', createdById: usuario.id },
      { title: 'Impresora atascada', description: 'La impresora HP LaserJet tiene un atasco de papel en la bandeja 2.', status: 'resolved', priority: 'medium', category: 'Hardware', assetId: assets[1].id, createdById: usuario.id, assignedToId: tecnico.id, resolvedAt: new Date() },
      { title: 'Problemas de conectividad WiFi', description: 'El router presenta interrupciones constantes cada 30 minutos.', status: 'in_progress', priority: 'urgent', category: 'Red', assetId: assets[4].id, createdById: usuario.id, assignedToId: tecnico.id },
    ],
  });

  console.log('✅ Tickets creados');
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
