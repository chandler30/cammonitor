import Camera from '../models/Camera.js';
import CameraLog from '../models/CameraLog.js';
import { Op } from 'sequelize';

export const getCameras = async (req, res) => {
  try {
    const cameras = await Camera.findAll({
      order: [['id', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: cameras,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching cameras',
    });
  }
};

export const updateCameraStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseTime } = req.body;

    const camera = await Camera.findByPk(id);
    if (!camera) {
      return res.status(404).json({
        status: 'error',
        message: 'Camera not found',
      });
    }

    camera.status = status;
    camera.lastSeen = new Date();
    await camera.save();

    // Log the status change with response time
    await CameraLog.create({
      cameraId: camera.id,
      status,
      responseTime,
    });

    res.status(200).json({
      status: 'success',
      data: camera,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating camera status',
    });
  }
};

export const getCameraStats = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stats = await CameraLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: last24Hours,
        },
      },
      include: [Camera],
      order: [['timestamp', 'ASC']],
    });

    // Calculate additional statistics
    const cameraStats = {};
    stats.forEach((log) => {
      if (!cameraStats[log.cameraId]) {
        cameraStats[log.cameraId] = {
          totalChecks: 0,
          onlineCount: 0,
          totalResponseTime: 0,
          incidents: 0,
        };
      }

      cameraStats[log.cameraId].totalChecks++;
      if (log.status === 'online') {
        cameraStats[log.cameraId].onlineCount++;
      } else {
        cameraStats[log.cameraId].incidents++;
      }
      cameraStats[log.cameraId].totalResponseTime += log.responseTime || 0;
    });

    // Calculate averages
    Object.keys(cameraStats).forEach((cameraId) => {
      const stat = cameraStats[cameraId];
      stat.uptime = (stat.onlineCount / stat.totalChecks) * 100;
      stat.avgResponseTime = stat.totalResponseTime / stat.totalChecks;
    });

    res.status(200).json({
      status: 'success',
      data: {
        logs: stats,
        statistics: cameraStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching camera statistics',
    });
  }
};

export const saveCameras = async (req, res) => {
  try {
    const { cameras } = req.body;
    const cameraPromises = cameras.map((ip) =>
      Camera.findOrCreate({
        where: { ip },
        defaults: { name: `Camera ${ip}`, status: 'online' },
      })
    );

    await Promise.all(cameraPromises);
    res.status(200).send({ message: 'Cameras saved successfully' });
  } catch (error) {
    console.error('Error saving cameras:', error);
    res.status(500).send({ message: 'Error saving cameras' });
  }
};