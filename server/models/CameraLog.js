import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Camera } from './Camera.js';

const CameraLog = sequelize.define('CameraLog', {
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
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('online', 'offline'),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  indexes: [
    {
      fields: ['cameraId', 'timestamp'],
    },
    {
      fields: ['status'],
    },
  ],
});

Camera.hasMany(CameraLog, { foreignKey: 'cameraId', onDelete: 'CASCADE' });
CameraLog.belongsTo(Camera, { foreignKey: 'cameraId' });

export { CameraLog };
export default CameraLog;