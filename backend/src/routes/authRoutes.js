import express from 'express';
import { syncUser, getProfile, updateProfile, deleteMyAccount } from '../controllers/authController.js';

const router = express.Router();

router.post('/me', syncUser);
router.delete('/me', deleteMyAccount);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export default router;
