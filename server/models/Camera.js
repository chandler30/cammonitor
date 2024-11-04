import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Camera = sequelize.define('Camera', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('online', 'offline'),
    defaultValue: 'offline',
  },
  lastSeen: {
    type: DataTypes.DATE,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['ip'],
    },
  ],
});

export { Camera };
export default Camera;