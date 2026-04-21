import { UserRole } from '@prisma/client';

// Payload que se guarda en el JWT
export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Extiende Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}
