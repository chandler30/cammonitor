import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Camera from './Camera.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cameraId: {
    type: DataTypes.INTEGER,
    references: {
      model: Camera,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('offline', 'online', 'error'),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

Camera.hasMany(Notification);
Notification.belongsTo(Camera);

export default Notification;