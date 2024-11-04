import { Notification, Camera, FoundDevice, CameraLog } from '../models/index.js';
import { Op } from 'sequelize';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        timestamp: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: [{
        model: Camera,
        include: [FoundDevice]
      }],
      order: [['timestamp', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener notificaciones',
    });
  }
};

export const createNotification = async (type, message, cameraId = null) => {
  try {
    // Verificar si existe una notificación similar no leída
    const existingNotification = await Notification.findOne({
      where: {
        type,
        cameraId,
        read: false,
        timestamp: {
          [Op.gte]: new Date(Date.now() - 4 * 60 * 60 * 1000), // Últimas 4 horas
        },
      },
    });

    // Si es una notificación de intermitencia severa (más de 10 incidentes), siempre crearla
    const isUrgent = message.includes('intermitencia severa') || message.includes('10 desconexiones');

    if (!existingNotification || isUrgent) {
      // Eliminar notificaciones antiguas del mismo dispositivo y tipo
      await Notification.destroy({
        where: {
          type,
          cameraId,
          timestamp: {
            [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Más de 24 horas
          },
        },
      });

      // Limitar a máximo 50 notificaciones por dispositivo
      const deviceNotifications = await Notification.findAll({
        where: { cameraId },
        order: [['timestamp', 'DESC']],
      });

      if (deviceNotifications.length >= 50) {
        const notificationsToDelete = deviceNotifications.slice(49);
        await Promise.all(
          notificationsToDelete.map(notification =>
            Notification.destroy({ where: { id: notification.id } })
          )
        );
      }

      await Notification.create({
        type,
        message,
        cameraId,
        timestamp: new Date(),
        read: false,
      });
    } else if (existingNotification) {
      // Actualizar el timestamp de la notificación existente
      await existingNotification.update({
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};

// Función para verificar y crear notificaciones de dispositivos problemáticos
export const checkDeviceIssues = async () => {
  try {
    const devices = await FoundDevice.findAll({
      include: [Camera],
      where: {
        type: {
          [Op.not]: null
        }
      }
    });

    for (const device of devices) {
      // Verificar dispositivos offline por más de 1 hora
      if (device.status === 'offline') {
        const offlineTime = new Date() - new Date(device.lastSeen);
        const hoursOffline = offlineTime / (1000 * 60 * 60);

        if (hoursOffline >= 1) {
          await createNotification(
            'error',
            `${device.Camera?.name || device.ip} lleva ${Math.floor(hoursOffline)} horas fuera de línea`,
            device.Camera?.id
          );
        }
      }

      // Verificar dispositivos con reconexiones frecuentes
      const recentLogs = await CameraLog.findAll({
        where: {
          cameraId: device.Camera?.id,
          timestamp: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        order: [['timestamp', 'DESC']]
      });

      const statusChanges = recentLogs.length;
      const incidents = Math.floor(statusChanges / 2);

      if (incidents > 10) {
        await createNotification(
          'warning',
          `${device.Camera?.name || device.ip} presenta intermitencia severa con ${incidents} desconexiones en las últimas 24 horas`,
          device.Camera?.id
        );

        // Actualizar el contador de incidentes y marcar como intermitente
        await device.update({
          incidents: incidents,
          isIntermittent: true
        });
      } else if (incidents > 5) {
        await createNotification(
          'warning',
          `${device.Camera?.name || device.ip} presenta inestabilidad con ${incidents} desconexiones en las últimas 24 horas`,
          device.Camera?.id
        );

        await device.update({
          incidents: incidents,
          isIntermittent: true
        });
      } else if (device.isIntermittent) {
        // Si el dispositivo ya no presenta intermitencia, actualizar su estado
        await device.update({
          incidents: 0,
          isIntermittent: false
        });
      }
    }
  } catch (error) {
    console.error('Error al verificar problemas de dispositivos:', error);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.destroy({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Notificación eliminada'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al eliminar la notificación'
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.update(
      { read: true },
      {
        where: { id },
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar notificación',
    });
  }
};

export const createScanNotification = async (devicesFound, newDevices, scanDuration) => {
  try {
    const message = `Escaneo completado: ${devicesFound} dispositivos encontrados (${newDevices} nuevos) en ${scanDuration / 1000} segundos`;
    await createNotification('info', message);
  } catch (error) {
    console.error('Error al crear notificación de escaneo:', error);
  }
};