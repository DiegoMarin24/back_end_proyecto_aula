import { Router } from 'express';
import { getAll, create } from '../controllers/users.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);
router.get('/',  getAll);
router.post('/', create);

export default router;
