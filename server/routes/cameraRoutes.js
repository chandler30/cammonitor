import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { getCameras, updateCameraStatus, getCameraStats, saveCameras } from '../controllers/cameraController.js';

const router = express.Router();
router.use(protect);

router.get('/', getCameras);
router.get('/stats', getCameraStats);
router.patch('/:id/status', restrictTo('admin'), updateCameraStatus);
router.post('/save', saveCameras); 

export default router;
