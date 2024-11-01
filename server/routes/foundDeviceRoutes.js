import express from 'express';
import { getFoundDevices } from '../controllers/foundDeviceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getFoundDevices);

export default router;
