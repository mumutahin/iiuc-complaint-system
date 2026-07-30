import express from 'express';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { getOverview } from '../controllers/analyticsController.js';

const router = express.Router();

router.use(restrictTo('admin', 'superadmin'));
router.get('/overview', getOverview);

export default router;
