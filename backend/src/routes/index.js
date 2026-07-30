import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import authRoutes from './authRoutes.js';
import complaintRoutes from './complaintRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import userRoutes from './userRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = express.Router();

// Every route mounted below requires a valid Firebase token. The one
// route that must stay public — GET /api/health — is registered
// directly in app.js, BEFORE this router, so it never hits this line.
router.use(authMiddleware);

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);

export default router;
