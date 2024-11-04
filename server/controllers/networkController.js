import { exec } from 'child_process';
import { promisify } from 'util';
import { Camera, FoundDevice, NetworkScan } from '../models/index.js';
import { networkInterfaces } from 'os';
import { createScanNotification } from './notificationController.js';

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

export const scanNetwork = async (req, res) => {
  try {
    const { startIp, endIp } = req.body;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(startIp) || !ipPattern.test(endIp)) {
      return res.status(400).json({
        status: 'error',
        message: 'Formato de IP inválido'
      });
    }

    const baseNetwork = startIp.split('.').slice(0, 3).join('.');
    const startHost = parseInt(startIp.split('.')[3]);
    const endHost = parseInt(endIp.split('.')[3]);
    let progress = 0;
    const totalHosts = endHost - startHost + 1;
    const onlineHosts = [];
    let newDevices = 0;
    let totalPingTime = 0;
    let onlineCount = 0;

    // Enviar evento SSE para iniciar el progreso
    if (req.app.locals.sseClients) {
      req.app.locals.sseClients.forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'scan_progress', progress: 0 })}\n\n`);
      });
    }

    const scanStartTime = Date.now();

    for (let i = startHost; i <= endHost; i++) {
      const ip = `${baseNetwork}.${i}`;
      const { isOnline, pingTime } = await pingHost(ip);

      progress = ((i - startHost + 1) / totalHosts) * 100;
      
      // Actualizar progreso
      if (req.app.locals.sseClients) {
        req.app.locals.sseClients.forEach(client => {
          client.write(`data: ${JSON.stringify({ 
            type: 'scan_progress', 
            progress,
            currentIp: ip,
            status: isOnline ? 'online' : 'offline',
            pingTime: pingTime || 0
          })}\n\n`);
        });
      }

      if (isOnline) {
        onlineHosts.push(ip);
        if (pingTime) {
          totalPingTime += pingTime;
          onlineCount++;
        }

        const [device, created] = await FoundDevice.findOrCreate({
          where: { ip },
          defaults: {
            status: 'online',
            lastSeen: new Date()
          }
        });

        if (created) {
          newDevices++;
        } else {
          await device.update({
            status: 'online',
            lastSeen: new Date()
          });
        }
      } else {
        await FoundDevice.update(
          { status: 'offline' },
          { where: { ip } }
        );
      }
    }

    const scanEndTime = Date.now();
    const scanDuration = scanEndTime - scanStartTime;
    const averagePingTime = onlineCount > 0 ? totalPingTime / onlineCount : 0;

    // Crear notificación del resultado del escaneo
    await createScanNotification(onlineHosts.length, newDevices, scanDuration);

    // Notificar finalización
    if (req.app.locals.sseClients) {
      req.app.locals.sseClients.forEach(client => {
        client.write(`data: ${JSON.stringify({ 
          type: 'scan_complete',
          devicesFound: onlineHosts.length,
          newDevices,
          duration: scanDuration
        })}\n\n`);
      });
    }

    await NetworkScan.create({
      ipRange: `${startIp}-${endIp}`,
      devicesFound: onlineHosts.length,
      newDevices,
      scanDuration,
      averagePingTime
    });

    res.status(200).json({
      status: 'success',
      data: {
        scannedRange: `${startIp} - ${endIp}`,
        onlineHosts,
        newDevices,
        averagePingTime
      }
    });
  } catch (error) {
    console.error('Error durante el escaneo de red:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al escanear la red'
    });
  }
};

export const getIpAddress = async (req, res) => {
  try {
    const nets = networkInterfaces();
    let ipAddress = '';

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ipAddress = net.address;
          break;
        }
      }
      if (ipAddress) break;
    }

    res.status(200).json({
      status: 'success',
      ipAddress
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener la dirección IP'
    });
  }
};

export const updateDeviceType = async (req, res) => {
  try {
    const { ip, type } = req.body;
    await FoundDevice.update({ type }, { where: { ip } });

    res.status(200).json({
      status: 'success',
      message: 'Tipo de dispositivo actualizado'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar el tipo de dispositivo'
    });
  }
};

export const getScanHistory = async (req, res) => {
  try {
    const history = await NetworkScan.findAll({
      order: [['scanDate', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener el historial de escaneos'
    });
  }
};

export const removeDevice = async (req, res) => {
  try {
    const { ip } = req.params;
    await FoundDevice.destroy({ where: { ip } });

    res.status(200).json({
      status: 'success',
      message: 'Dispositivo eliminado'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al eliminar el dispositivo'
    });
  }
};