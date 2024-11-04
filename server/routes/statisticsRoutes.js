import express from 'express';
import { getDetailedStats } from '../controllers/statisticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/detailed', getDetailedStats);

export default router;