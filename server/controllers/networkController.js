import { exec } from 'child_process';
import { promisify } from 'util';
import Camera from '../models/Camera.js';
import FoundDevice from '../models/FoundDevice.js';
import NetworkScan from '../models/NetworkScan.js';
import { networkInterfaces } from 'os';

const execAsync = promisify(exec);

export const scanNetwork = async (req, res) => {
  try {
    const { startIp, endIp } = req.body;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(startIp) || !ipPattern.test(endIp)) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Invalid IP address format' });
    }

    const baseNetwork = startIp.split('.').slice(0, 3).join('.');
    const startHost = parseInt(startIp.split('.')[3]);
    const endHost = parseInt(endIp.split('.')[3]);
    const onlineHosts = [];
    let newDevices = 0;

    for (let i = startHost; i <= endHost; i++) {
      const ip = `${baseNetwork}.${i}`;
      try {
        const pingCommand =
          process.platform === 'win32'
            ? `ping -n 1 -w 1000 ${ip}`
            : `ping -c 1 -W 1 ${ip}`;
        const { stdout } = await execAsync(pingCommand);
        const isOnline = stdout.includes('ttl') || stdout.includes('TTL');

        if (isOnline) {
          onlineHosts.push(ip);
          const existingDevice = await FoundDevice.findOne({ where: { ip } });
          if (!existingDevice) {
            newDevices++;
          }
        }

        const [camera] = await Camera.findOrCreate({
          where: { ip },
          defaults: {
            name: `Camera at ${ip}`,
            status: isOnline ? 'online' : 'offline',
            lastSeen: new Date(),
          },
        });

        await FoundDevice.findOrCreate({
          where: { ip },
          defaults: {
            cameraId: camera.id,
            lastSeen: new Date(),
            status: isOnline ? 'online' : 'offline',
          },
        });

        if (!isOnline) {
          await FoundDevice.update(
            { status: 'offline', lastSeen: new Date() },
            { where: { ip } }
          );
        }
      } catch (error) {
        await Camera.update(
          { status: 'offline', lastSeen: new Date() },
          { where: { ip } }
        );
        await FoundDevice.update(
          { status: 'offline', lastSeen: new Date() },
          { where: { ip } }
        );
      }
    }

    // Registrar el escaneo
    await NetworkScan.create({
      ipRange: `${startIp}-${endIp}`,
      devicesFound: onlineHosts.length,
      newDevices,
      scanDuration: 1000, // Placeholder, podríamos calcular el tiempo real
    });

    res.status(200).json({
      status: 'success',
      data: { 
        scannedRange: `${startIp} - ${endIp}`, 
        onlineHosts,
        newDevices 
      },
    });
  } catch (error) {
    console.error('Error during network scan:', error);
    res
      .status(500)
      .json({ status: 'error', message: 'Error scanning network' });
  }
};

export const getScanHistory = async (req, res) => {
  try {
    const history = await NetworkScan.findAll({
      order: [['scanDate', 'DESC']],
      limit: 10,
    });
    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scan history' });
  }
};

export const updateDeviceType = async (req, res) => {
  try {
    const { ip, type } = req.body;

    const foundDevice = await FoundDevice.findOne({ where: { ip } });
    if (!foundDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    foundDevice.type = type;
    await foundDevice.save();

    if (type === 'camera') {
      await Camera.update({ type }, { where: { ip } });
    }

    res.status(200).json({ message: 'Device type updated successfully' });
  } catch (error) {
    console.error('Error updating device type:', error);
    res.status(500).json({ message: 'Error updating device type' });
  }
};

export const removeDevice = async (req, res) => {
  try {
    const { ip } = req.params;
    await FoundDevice.destroy({ where: { ip } });
    res.status(200).json({ message: 'Device removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing device' });
  }
};

export const getIpAddress = (req, res) => {
  const nets = networkInterfaces();
  let ipAddress = '';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ipAddress = net.address;
        break;
      }
    }
    if (ipAddress) {
      break;
    }
  }

  res.status(200).json({ ipAddress });
};