import Notification from '../models/Notification.js';
import { Op } from 'sequelize';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        read: false,
        timestamp: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: ['Camera'],
      order: [['timestamp', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching notifications',
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
      message: 'Notification marked as read',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating notification',
    });
  }
};

export const createNotification = async (camera, type, message) => {
  try {
    // Check if there's a similar unread notification in the last hour
    const existingNotification = await Notification.findOne({
      where: {
        cameraId: camera.id,
        type,
        read: false,
        timestamp: {
          [Op.gte]: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (!existingNotification) {
      await Notification.create({
        cameraId: camera.id,
        type,
        message,
      });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};