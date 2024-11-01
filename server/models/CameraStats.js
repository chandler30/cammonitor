import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Camera from './Camera.js';

const CameraStats = sequelize.define('CameraStats', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  totalChecks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  successfulChecks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failedChecks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  averageResponseTime: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  uptime: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  incidents: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

Camera.hasMany(CameraStats);
CameraStats.belongsTo(Camera);

export default CameraStats;