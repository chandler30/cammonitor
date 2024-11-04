import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getCameras,
  getCameraStats,
  getCameraHistory,
  updateCameraName,
  getDeviceDetails
} from '../controllers/cameraController.js';

const router = express.Router();
router.use(protect);

// Rutas públicas (accesibles para todos los usuarios autenticados)
router.get('/', getCameras);
router.get('/stats', getCameraStats);
router.get('/history', getCameraHistory);
router.get('/:id/details', getDeviceDetails);

// Rutas protegidas (solo para administradores)
router.patch('/:id/name', restrictTo('admin'), updateCameraName);

export default router;