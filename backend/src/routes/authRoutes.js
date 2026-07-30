import express from 'express';
import { syncUser, getProfile, updateProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/me', syncUser);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export default router;
