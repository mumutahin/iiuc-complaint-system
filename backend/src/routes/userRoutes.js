import express from 'express';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { getUsers, updateUserRole, setUserActive } from '../controllers/userController.js';

const router = express.Router();

router.use(restrictTo('superadmin'));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/active', setUserActive);

export default router;
