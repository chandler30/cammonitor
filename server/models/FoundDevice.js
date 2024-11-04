import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Camera } from './Camera.js';

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
    validate: {
      isIP: true,
    },
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('online', 'offline'),
    defaultValue: 'offline',
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  incidents: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isIntermittent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['ip'],
    },
  ],
});

FoundDevice.belongsTo(Camera, { foreignKey: 'cameraId' });
Camera.hasMany(FoundDevice, { foreignKey: 'cameraId' });

export { FoundDevice };
export default FoundDevice;