import FoundDevice from '../models/FoundDevice.js';

export const getFoundDevices = async (req, res) => {
  try {
    const foundDevices = await FoundDevice.findAll();
    res.status(200).json({ data: foundDevices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching found devices' });
  }
};
