import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Camera from './Camera.js';

const FoundDevice = sequelize.define('FoundDevice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cameraId: {
    type: DataTypes.INTEGER,
    references: {
      model: Camera,
      key: 'id',
    },
    allowNull: true,
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

FoundDevice.belongsTo(Camera, { foreignKey: 'cameraId' });
Camera.hasMany(FoundDevice, { foreignKey: 'cameraId' });

export default FoundDevice;
