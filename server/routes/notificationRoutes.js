import express from 'express';
import {
  getNotifications,
  markAsRead,
  createNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

export default router;