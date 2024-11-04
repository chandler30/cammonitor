import { Op } from 'sequelize';
import { Camera, CameraLog, FoundDevice, NetworkScan, Notification } from '../models/index.js';
import sequelize from '../config/database.js';

const getTimeRange = (range) => {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default: // '24h'
      return new Date(now - 24 * 60 * 60 * 1000);
  }
};

const getHourFromTimestamp = () => {
  // SQLite strftime function to extract hour
  return sequelize.fn('strftime', '%H', sequelize.col('timestamp'));
};

export const getDetailedStats = async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    const startDate = getTimeRange(range);

    // 1. Estadísticas generales
    const devices = await FoundDevice.findAll({
      include: [Camera],
      where: {
        type: {
          [Op.not]: null
        }
      }
    });

    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const uptime = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

    // 2. Estadísticas de red
    const networkStats = await NetworkScan.findAll({
      where: {
        scanDate: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('averagePingTime')), 'avgPingTime'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalScans'],
        [sequelize.fn('SUM', sequelize.col('devicesFound')), 'totalDevicesFound'],
        [sequelize.fn('SUM', sequelize.col('newDevices')), 'totalNewDevices']
      ],
      raw: true
    });

    // 3. Estadísticas de incidentes
    const incidents = await CameraLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      include: [{
        model: Camera,
        include: [FoundDevice]
      }],
      order: [['timestamp', 'ASC']]
    });

    // 4. Análisis de dispositivos
    const deviceAnalysis = await Promise.all(devices.map(async (device) => {
      const deviceLogs = incidents.filter(i => i.Camera?.id === device.Camera?.id);
      const statusChanges = deviceLogs.length;
      const offlineCount = deviceLogs.filter(log => log.status === 'offline').length;
      
      let totalOfflineTime = 0;
      let currentOfflineStart = null;

      deviceLogs.forEach((log, index) => {
        if (log.status === 'offline') {
          currentOfflineStart = new Date(log.timestamp);
        } else if (currentOfflineStart && log.status === 'online') {
          const offlineDuration = (new Date(log.timestamp) - currentOfflineStart) / (1000 * 60);
          totalOfflineTime += offlineDuration;
          currentOfflineStart = null;
        }
      });

      // Si el último estado es offline, calcular hasta ahora
      if (currentOfflineStart) {
        const offlineDuration = (new Date() - currentOfflineStart) / (1000 * 60);
        totalOfflineTime += offlineDuration;
      }

      return {
        id: device.id,
        name: device.Camera?.name || `Device ${device.ip}`,
        ip: device.ip,
        type: device.type,
        currentStatus: device.status,
        statusChanges,
        offlineIncidents: offlineCount,
        totalOfflineTime,
        uptime: 100 - (totalOfflineTime / (range === '24h' ? 1440 : range === '7d' ? 10080 : 43200) * 100),
        isIntermittent: device.isIntermittent,
        lastSeen: device.lastSeen
      };
    }));

    // 5. Análisis temporal usando SQLite strftime
    const timeAnalysis = await CameraLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [getHourFromTimestamp(), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'offline' THEN 1 ELSE 0 END")), 'offline'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'online' THEN 1 ELSE 0 END")), 'online']
      ],
      group: [getHourFromTimestamp()],
      order: [[getHourFromTimestamp(), 'ASC']],
      raw: true
    });

    // Procesar los datos temporales para asegurar todas las horas
    const processedTimeAnalysis = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      const existingData = timeAnalysis.find(t => t.hour === hour) || {
        hour,
        total: 0,
        offline: 0,
        online: 0
      };
      return {
        ...existingData,
        hour,
        total: parseInt(existingData.total) || 0,
        offline: parseInt(existingData.offline) || 0,
        online: parseInt(existingData.online) || 0
      };
    });

    // 6. Notificaciones
    const notifications = await Notification.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      include: [{
        model: Camera,
        include: [FoundDevice]
      }],
      order: [['timestamp', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: {
        generalStats: {
          totalDevices,
          onlineDevices,
          offlineDevices: totalDevices - onlineDevices,
          uptime,
          timeRange: range
        },
        networkStats: networkStats[0],
        deviceAnalysis,
        timeAnalysis: processedTimeAnalysis,
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          message: n.message,
          timestamp: n.timestamp,
          deviceName: n.Camera?.name || 'Sistema',
          deviceIp: n.Camera?.ip
        }))
      }
    });
  } catch (error) {
    console.error('Error getting detailed statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener estadísticas detalladas'
    });
  }
};