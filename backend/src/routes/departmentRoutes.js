import express from 'express';
import { restrictTo } from '../middleware/roleMiddleware.js';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

router.use(restrictTo('admin', 'superadmin'));

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', restrictTo('superadmin'), createDepartment);
router.patch('/:id', restrictTo('superadmin'), updateDepartment);
router.delete('/:id', restrictTo('superadmin'), deleteDepartment);

export default router;
