import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes    from './routes/auth.routes';
import assetsRoutes  from './routes/assets.routes';
import ticketsRoutes from './routes/tickets.routes';
import reportsRoutes from './routes/reports.routes';
import usersRoutes   from './routes/users.routes';

// Importar los tipos extendidos de Express
import './types';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middlewares globales
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Rutas
app.use('/api/auth',    authRoutes);
app.use('/api/assets',  assetsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users',   usersRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'AssetFlow API funcionando correctamente' });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

// Error handler global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
