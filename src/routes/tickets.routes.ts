import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/tickets.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/',    getAll);
router.get('/:id', getById);
router.post('/',    create);               // cualquier usuario autenticado puede crear
router.put('/:id',  adminMiddleware, update);
router.delete('/:id', adminMiddleware, remove);

export default router;
