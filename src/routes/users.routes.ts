import { Router } from 'express';
import { getAll, create, updateRole } from '../controllers/users.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);
router.get('/',              getAll);
router.post('/',             create);
router.patch('/:id/role',   updateRole);  // PATCH /api/users/:id/role

export default router;
