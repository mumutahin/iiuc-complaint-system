import express from 'express';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { downloadPdfReport } from '../controllers/reportController.js';

const router = express.Router();

router.use(restrictTo('admin', 'superadmin'));
router.get('/pdf', downloadPdfReport);

export default router;
