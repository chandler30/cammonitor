import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear directorio de datos si no existe
const dbPath = path.join(__dirname, '../../data');
try {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
} catch (error) {
  console.error('Error creating data directory:', error);
}

// Configurar Sequelize con SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dbPath, 'camera_monitoring.db'),
  logging: false,
  define: {
    timestamps: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Función para verificar y limpiar la base de datos si es necesario
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    const dbFile = path.join(dbPath, 'camera_monitoring.db');
    if (fs.existsSync(dbFile)) {
      try {
        fs.unlinkSync(dbFile);
        console.log('Corrupted database file removed');
        return false;
      } catch (unlinkError) {
        console.error('Error removing database file:', unlinkError);
        throw unlinkError;
      }
    }
    return false;
  }
};

export { initializeDatabase };
export default sequelize;