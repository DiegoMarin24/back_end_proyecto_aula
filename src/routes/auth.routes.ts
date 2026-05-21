import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login',    login);
router.post('/register', register);   // público — crea cuenta como 'user'
router.get('/me',        authMiddleware, getMe);

export default router;
