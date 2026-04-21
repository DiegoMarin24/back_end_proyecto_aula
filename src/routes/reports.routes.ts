import { Router } from 'express';
import { getSummary } from '../controllers/reports.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/summary', authMiddleware, adminMiddleware, getSummary);

export default router;
