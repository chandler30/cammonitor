import { FoundDevice, Camera } from '../models/index.js';

export const getFoundDevices = async (req, res) => {
  try {
    const foundDevices = await FoundDevice.findAll({
      include: [{
        model: Camera,
        required: false
      }],
      order: [['lastSeen', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: foundDevices.map(device => ({
        id: device.id,
        ip: device.ip,
        type: device.type,
        status: device.status,
        lastSeen: device.lastSeen,
        name: device.Camera?.name || `Device at ${device.ip}`
      }))
    });
  } catch (error) {
    console.error('Error fetching found devices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching found devices'
    });
  }
};