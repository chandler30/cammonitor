import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NetworkScan = sequelize.define('NetworkScan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  scanDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ipRange: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  devicesFound: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  newDevices: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  scanDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  averagePingTime: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  indexes: [
    {
      fields: ['scanDate'],
    },
  ],
});

export { NetworkScan };
export default NetworkScan;