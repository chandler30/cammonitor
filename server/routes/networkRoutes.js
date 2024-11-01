import express from 'express';
import {
  scanNetwork,
  getIpAddress,
  updateDeviceType,
  getScanHistory,
  removeDevice,
} from '../controllers/networkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/scan', scanNetwork);
router.get('/ip', getIpAddress);
router.post('/update-device-type', updateDeviceType);
router.get('/scan-history', getScanHistory);
router.delete('/devices/:ip', removeDevice);

export default router;