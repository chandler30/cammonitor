import { Camera, CameraLog, FoundDevice, NetworkScan } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createNotification } from './notificationController.js';

const execAsync = promisify(exec);

const pingHost = async (ip) => {
  try {
    const startTime = Date.now();
    const pingCommand = process.platform === 'win32'
      ? `ping -n 1 -w 1000 ${ip}`
      : `ping -c 1 -W 1 ${ip}`;
    
    const { stdout } = await execAsync(pingCommand);
    const endTime = Date.now();
    const pingTime = endTime - startTime;
    
    const isOnline = stdout.includes('ttl') || stdout.includes('TTL');
    return { isOnline, pingTime: isOnline ? pingTime : null };
  } catch (error) {
    return { isOnline: false, pingTime: null };
  }
};

export const monitorIdentifiedCameras = async () => {
  try {
    const devices = await FoundDevice.findAll({
      include: [Camera],
      where: {
        type: {
          [Op.not]: null
        }
      }
    });

    let totalPingTime = 0;
    let onlineCount = 0;

    for (const device of devices) {
      const { isOnline, pingTime } = await pingHost(device.ip);
      const status = isOnline ? 'online' : 'offline';
      
      if (pingTime) {
        totalPingTime += pingTime;
        onlineCount++;
      }

      // Actualizar estado del dispositivo
      await device.update({
        status,
        lastSeen: isOnline ? new Date() : device.lastSeen
      });

      // Buscar o crear cámara asociada
      let camera = await Camera.findOne({ where: { ip: device.ip } });
      
      if (!camera) {
        camera = await Camera.create({
          ip: device.ip,
          name: device.name || `Dispositivo ${device.ip}`,
          status,
          lastSeen: isOnline ? new Date() : null
        });
        await device.update({ cameraId: camera.id });
      } else {
        // Si la cámara existe, actualizar su estado
        const previousStatus = camera.status;
        await camera.update({
          status,
          lastSeen: isOnline ? new Date() : camera.lastSeen
        });

        // Si hubo un cambio de estado, registrar en el log
        if (previousStatus !== status) {
          await CameraLog.create({
            cameraId: camera.id,
            status,
            timestamp: new Date()
          });

          // Verificar incidencias recientes
          const recentLogs = await CameraLog.findAll({
            where: {
              cameraId: camera.id,
              timestamp: {
                [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            },
            order: [['timestamp', 'DESC']]
          });

          const incidents = Math.floor(recentLogs.length / 2);
          const isIntermittent = incidents > 5;

          // Actualizar contador de incidencias y estado de intermitencia
          await device.update({
            incidents,
            isIntermittent
          });

          // Crear notificación si es necesario
          if (status === 'offline') {
            await createNotification(
              'error',
              `${camera.name || device.ip} se ha desconectado`,
              camera.id
            );
          } else if (isIntermittent && incidents > 10) {
            await createNotification(
              'warning',
              `${camera.name || device.ip} presenta intermitencia severa con ${incidents} desconexiones en las últimas 24 horas`,
              camera.id
            );
          }
        }
      }
    }

    // Registrar estadísticas de red
    if (onlineCount > 0) {
      await NetworkScan.create({
        ipRange: 'monitoring',
        devicesFound: devices.length,
        newDevices: 0,
        scanDuration: 0,
        averagePingTime: totalPingTime / onlineCount
      });
    }

  } catch (error) {
    console.error('Error monitoreando dispositivos:', error);
  }
};

export const updateCameraName = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const device = await FoundDevice.findByPk(id, {
      include: [Camera]
    });

    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Dispositivo no encontrado'
      });
    }

    if (device.Camera) {
      await device.Camera.update({ name });
    } else {
      const camera = await Camera.create({
        ip: device.ip,
        name,
        status: device.status,
        lastSeen: device.lastSeen
      });
      await device.update({ cameraId: camera.id });
    }

    res.status(200).json({
      status: 'success',
      message: 'Nombre actualizado correctamente'
    });
  } catch (error) {
    console.error('Error updating camera name:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar el nombre'
    });
  }
};

export const getCameras = async (req, res) => {
  try {
    const devices = await FoundDevice.findAll({
      where: {
        type: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      include: [{
        model: Camera,
        required: false
      }]
    });

    // Obtener logs recientes para cada dispositivo
    const deviceData = await Promise.all(devices.map(async (device) => {
      let incidents = 0;
      let isIntermittent = false;

      if (device.Camera) {
        // Obtener logs de las últimas 24 horas para esta cámara específica
        const recentLogs = await CameraLog.findAll({
          where: {
            cameraId: device.Camera.id,
            timestamp: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          order: [['timestamp', 'DESC']]
        });

        // Contar cambios de estado reales (offline -> online o viceversa)
        let lastStatus = null;
        let statusChanges = 0;

        recentLogs.forEach(log => {
          if (lastStatus !== null && log.status !== lastStatus) {
            statusChanges++;
          }
          lastStatus = log.status;
        });

        // Cada par de cambios (offline -> online) cuenta como un incidente
        incidents = Math.floor(statusChanges / 2);
        isIntermittent = incidents > 5;

        // Si hay incidentes, actualizar el dispositivo
        if (incidents > 0) {
          await device.update({
            incidents,
            isIntermittent
          });

          // Si hay intermitencia severa, crear notificación
          if (incidents > 10) {
            await createNotification(
              'warning',
              `${device.Camera.name || device.ip} presenta intermitencia severa con ${incidents} desconexiones en las últimas 24 horas`,
              device.Camera.id
            );
          }
        } else {
          // Si no hay incidentes, resetear los contadores
          await device.update({
            incidents: 0,
            isIntermittent: false
          });
        }
      }

      return {
        id: device.id,
        ip: device.ip,
        name: device.Camera?.name || `Dispositivo ${device.ip}`,
        type: device.type,
        status: device.status,
        lastSeen: device.lastSeen,
        incidents,
        isIntermittent
      };
    }));

    res.status(200).json({
      status: 'success',
      data: deviceData
    });
  } catch (error) {
    console.error('Error fetching cameras:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener las cámaras'
    });
  }
};


export const getCameraStats = async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    let timeRange;

    switch (range) {
      case '7d':
        timeRange = 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeRange = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeRange = 24 * 60 * 60 * 1000;
    }

    const startDate = new Date(Date.now() - timeRange);

    const networkScans = await NetworkScan.findAll({
      where: {
        scanDate: {
          [Op.gte]: startDate
        },
        averagePingTime: {
          [Op.not]: null
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('averagePingTime')), 'avgPingTime']
      ],
      raw: true
    });

    const averageResponseTime = parseFloat(networkScans[0]?.avgPingTime) || 0;

    const devices = await FoundDevice.findAll({
      where: {
        type: {
          [Op.not]: null
        }
      }
    });

    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const uptime = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

    const incidents = await CameraLog.count({
      where: {
        timestamp: {
          [Op.gte]: startDate
        },
        status: 'offline'
      }
    });

    const dailyStats = await CameraLog.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'day'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "online" THEN 1 END')), 'online_count'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'total_count'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "offline" THEN 1 END')), 'incident_count']
      ],
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']],
      raw: true
    });

    const processedDailyStats = dailyStats.map(day => ({
      day: day.day,
      uptime: (day.online_count / day.total_count) * 100,
      incidents: day.incident_count,
      avgResponseTime: averageResponseTime
    }));

    res.status(200).json({
      status: 'success',
      data: {
        averageUptime: uptime,
        totalIncidents: incidents,
        averageResponseTime,
        dailyStats: processedDailyStats
      }
    });
  } catch (error) {
    console.error('Error getting camera stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener estadísticas'
    });
  }
};

export const getCameraHistory = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Obtener todos los dispositivos con sus cámaras asociadas
    const devices = await FoundDevice.findAll({
      where: {
        type: {
          [Op.not]: null
        }
      },
      include: [{
        model: Camera,
        required: false
      }]
    });

    // Inicializar datos por hora
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      const hourKey = i.toString().padStart(2, '0');
      const onlineCount = devices.filter(d => d.status === 'online').length;
      
      hourlyData[hourKey] = {
        hour: hourKey,
        online: onlineCount,
        offline: devices.length - onlineCount,
        devices: devices.map(device => ({
          id: device.id,
          name: device.Camera?.name || `Dispositivo ${device.ip}`,
          ip: device.ip,
          status: device.status,
          statusChanges: [], // Array para almacenar cambios de estado durante la hora
          totalOfflineTime: 0, // Tiempo total fuera de línea en minutos
          lastOfflineStart: null // Marca de tiempo del último inicio de desconexión
        }))
      };
    }

    // Obtener logs por hora con más detalles
    const logs = await CameraLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: last24Hours
        }
      },
      include: [{
        model: Camera,
        required: true
      }],
      order: [['timestamp', 'ASC']]
    });

    // Procesar logs para actualizar estados por hora
    logs.forEach((log, index) => {
      const hour = new Date(log.timestamp).getHours().toString().padStart(2, '0');
      if (hourlyData[hour]) {
        const deviceIndex = hourlyData[hour].devices.findIndex(
          d => d.ip === log.Camera.ip
        );

        if (deviceIndex !== -1) {
          const device = hourlyData[hour].devices[deviceIndex];
          const previousStatus = device.status;
          
          // Registrar cambio de estado
          device.statusChanges.push({
            timestamp: log.timestamp,
            status: log.status,
            duration: 0 // Se calculará después
          });

          // Actualizar contadores
          if (log.status === 'offline') {
            device.lastOfflineStart = log.timestamp;
            hourlyData[hour].online--;
            hourlyData[hour].offline++;
          } else if (log.status === 'online' && device.lastOfflineStart) {
            // Calcular duración de la desconexión
            const offlineDuration = Math.round(
              (new Date(log.timestamp) - new Date(device.lastOfflineStart)) / (1000 * 60)
            );
            device.totalOfflineTime += offlineDuration;
            
            // Actualizar la duración en el último cambio de estado
            const lastChange = device.statusChanges[device.statusChanges.length - 2];
            if (lastChange) {
              lastChange.duration = offlineDuration;
            }

            device.lastOfflineStart = null;
            hourlyData[hour].online++;
            hourlyData[hour].offline--;
          }

          device.status = log.status;
        }
      }
    });

    // Calcular duración para dispositivos que siguen offline al final de cada hora
    Object.values(hourlyData).forEach(hourData => {
      hourData.devices.forEach(device => {
        if (device.lastOfflineStart) {
          const nextHourStart = new Date(device.lastOfflineStart);
          nextHourStart.setHours(nextHourStart.getHours() + 1);
          nextHourStart.setMinutes(0);
          nextHourStart.setSeconds(0);
          nextHourStart.setMilliseconds(0);

          const offlineDuration = Math.round(
            (nextHourStart - new Date(device.lastOfflineStart)) / (1000 * 60)
          );
          
          if (device.statusChanges.length > 0) {
            device.statusChanges[device.statusChanges.length - 1].duration = offlineDuration;
          }
          device.totalOfflineTime += offlineDuration;
        }
      });

      // Filtrar solo dispositivos con cambios de estado o tiempo offline
      hourData.devices = hourData.devices.filter(
        device => device.statusChanges.length > 0 || device.totalOfflineTime > 0
      );
    });

    // Convertir a array y ordenar por hora
    const history = Object.values(hourlyData).sort((a, b) => a.hour.localeCompare(b.hour));

    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    console.error('Error getting camera history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener historial de cámaras'
    });
  }
};

const checkIntermittency = async (device, logs) => {
  const lastDayLogs = logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return logTime > oneDayAgo;
  });

  // Contar cambios de estado en las últimas 24 horas
  const statusChanges = lastDayLogs.length;
  const incidents = Math.floor(statusChanges / 2); // Cada ciclo offline-online cuenta como un incidente

  // Si hay más de 5 incidentes en 24 horas, consideramos que hay intermitencia
  if (incidents > 5) {
    await createNotification(
      'warning',
      `${device.Camera?.name || device.ip} presenta intermitencia con ${incidents} desconexiones en las últimas 24 horas`,
      device.Camera?.id
    );
    return incidents;
  }

  return 0;
};

export const getDeviceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await FoundDevice.findByPk(id, {
      include: [Camera]
    });

    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Dispositivo no encontrado'
      });
    }

    // Obtener logs de los últimos 30 días
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const logs = await CameraLog.findAll({
      where: {
        cameraId: device.Camera?.id,
        timestamp: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      order: [['timestamp', 'DESC']]
    });

    // Verificar intermitencia
    const intermittencyCount = await checkIntermittency(device, logs);

    // Calcular estadísticas
    const totalLogs = logs.length;
    const offlineLogs = logs.filter(log => log.status === 'offline').length;

    
    // Obtener tiempo de respuesta promedio
    const networkScans = await NetworkScan.findAll({
      where: {
        scanDate: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('averagePingTime')), 'avgPingTime']
      ],
      raw: true
    });

    // Procesar historial de incidentes
    const incidentHistory = [];
    let currentIncident = null;

    for (const log of logs) {
      if (log.status === 'offline' && (!currentIncident || currentIncident.type === 'online')) {
        if (currentIncident) {
          incidentHistory.push(currentIncident);
        }
        currentIncident = {
          type: 'offline',
          timestamp: log.timestamp,
          duration: 0
        };
      } else if (log.status === 'online' && currentIncident?.type === 'offline') {
        const duration = Math.round(
          (new Date(currentIncident.timestamp) - new Date(log.timestamp)) / (1000 * 60)
        );
        currentIncident.duration = duration;
        incidentHistory.push(currentIncident);
        currentIncident = {
          type: 'online',
          timestamp: log.timestamp
        };
      }
    }

    if (currentIncident) {
      incidentHistory.push(currentIncident);
    }

    // Calcular tiempo de actividad
    let uptime = 100;
    if (logs.length > 0) {
      const totalTimeRange = Date.now() - thirtyDaysAgo.getTime();
      let totalOfflineTime = 0;

      incidentHistory.forEach(incident => {
        if (incident.type === 'offline' && incident.duration) {
          totalOfflineTime += incident.duration * 60 * 1000;
        }
      });

      uptime = ((totalTimeRange - totalOfflineTime) / totalTimeRange) * 100;
    } else if (device.status === 'offline') {
      uptime = 0;
    }

    const details = {
      uptime,
      avgResponseTime: networkScans[0]?.avgPingTime || 0,
      lastOffline: logs.find(log => log.status === 'offline')?.timestamp || null,
      totalIncidents: Math.floor(totalLogs / 2),
      offlineIncidents: offlineLogs,
      incidentHistory: incidentHistory.slice(0, 10),
      responseTimeHistory: networkScans,
      intermittencyCount // Añadir el contador de intermitencia
    };

    res.status(200).json({
      status: 'success',
      data: details
    });
  } catch (error) {
    console.error('Error getting device details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener detalles del dispositivo'
    });
  }
};