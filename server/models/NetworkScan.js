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
    type: DataTypes.STRING,
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
    type: DataTypes.INTEGER, // in milliseconds
    allowNull: false,
  },
});

export default NetworkScan;