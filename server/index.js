import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { initializeDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import cameraRoutes from './routes/cameraRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import foundDeviceRoutes from './routes/foundDeviceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import { monitorIdentifiedCameras } from './controllers/cameraController.js';
import { checkDeviceIssues } from './controllers/notificationController.js';

// Import models to ensure they are registered
import './models/index.js';

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/found-devices', foundDeviceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistics', statisticsRoutes);

// Configurar SSE middleware
app.locals.sseClients = new Set();

app.get('/api/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const client = res;
  app.locals.sseClients.add(client);

  req.on('close', () => {
    app.locals.sseClients.delete(client);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5001;

// Function to delete database file
const deleteDatabaseFile = () => {
  const dbPath = path.join(__dirname, '../data/camera_monitoring.db');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log('Database file deleted successfully');
    } catch (error) {
      console.error('Error deleting database file:', error);
    }
  }
};

// Function to start server
const startServer = async () => {
  try {
    // Initialize database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.log('Database initialization required');
    }

    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sincronizar modelos con la base de datos
    await sequelize.sync().catch(err => {
      console.error('Error syncing database:', err);
      throw err;
    });
    console.log('Database tables have been synchronized');

    // Start monitoring cameras
    setInterval(monitorIdentifiedCameras, 120000); // Every 2 minutes
    setInterval(checkDeviceIssues, 300000); // Every 5 minutes

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        const fallbackPort = process.env.FALLBACK_PORT || PORT + 1;
        console.log(`Port ${PORT} is busy, trying ${fallbackPort}`);
        server.listen(fallbackPort);
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    
    // Si hay un error, eliminar la base de datos y reintentar
    deleteDatabaseFile();
    
    try {
      console.log('Retrying server start...');
      await sequelize.sync();
      console.log('Database has been reset and synchronized successfully');
      
      // Iniciar el servidor nuevamente
      const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });

      // Start monitoring after successful restart
      setInterval(monitorIdentifiedCameras, 120000);
      setInterval(checkDeviceIssues, 300000);
    } catch (retryError) {
      console.error('Failed to restart server:', retryError);
      process.exit(1);
    }
  }
};

startServer();