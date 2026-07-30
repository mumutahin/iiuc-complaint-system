import express from 'express';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';
import { createComplaintLimiter } from '../middleware/rateLimiters.js';
import { LIMITS } from '../../../shared/constants.js';
import {
  createComplaint,
  getMyComplaints,
  getComplaintStats,
  getCommunityComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  updateStatus,
  updatePriority,
  assignComplaint,
  addComment,
  toggleUpvote,
} from '../controllers/complaintController.js';

const router = express.Router();
const imagesField = uploadImage.array('images', LIMITS.MAX_IMAGES);

// --- Literal paths FIRST (must come before "/:id" below) ---------------
router.post('/', restrictTo('student'), createComplaintLimiter, imagesField, createComplaint);
router.get('/my', restrictTo('student'), getMyComplaints);
router.get('/stats', restrictTo('student'), getComplaintStats);
router.get('/community', getCommunityComplaints);
router.get('/', restrictTo('admin', 'superadmin'), getAllComplaints);

// --- Generic "/:id" and its sub-resources --------------------------------
router.get('/:id', getComplaintById);
router.patch('/:id', restrictTo('student'), imagesField, updateComplaint);
router.delete('/:id', restrictTo('student'), deleteComplaint);
router.patch('/:id/status', restrictTo('admin', 'superadmin'), updateStatus);
router.patch('/:id/priority', restrictTo('admin', 'superadmin'), updatePriority);
router.patch('/:id/assign', restrictTo('admin', 'superadmin'), assignComplaint);
router.post('/:id/comments', addComment);
router.post('/:id/upvote', restrictTo('student'), toggleUpvote);

export default router;
