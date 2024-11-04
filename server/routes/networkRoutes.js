import express from 'express';
import {
  scanNetwork,
  getIpAddress,
  updateDeviceType,
  getScanHistory,
  removeDevice,
} from '../controllers/networkController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Rutas públicas (accesibles para todos los usuarios autenticados)
router.get('/ip', getIpAddress);
router.get('/scan-history', getScanHistory);

// Rutas protegidas (solo para administradores)
router.post('/scan', restrictTo('admin'), scanNetwork);
router.post('/update-device-type', restrictTo('admin'), updateDeviceType);
router.delete('/devices/:ip', restrictTo('admin'), removeDevice);

export default router;