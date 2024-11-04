import * as XLSX from 'xlsx';
import { formatDateForExcel, formatDuration } from './dateUtils';

interface ExportData {
  generalStats: any;
  deviceAnalysis: any[];
  timeAnalysis: any[];
  notifications: any[];
  networkStats: any;
}

const formatUptime = (uptime: number): string => {
  return uptime ? `${uptime.toFixed(2)}%` : '0%';
};

export const exportToExcel = (data: ExportData, timeRange: string) => {
  const workbook = XLSX.utils.book_new();
  const now = new Date();

  // 1. Resumen General
  const summaryData = [{
    'Métrica': 'Total de Dispositivos',
    'Valor': data.generalStats.totalDevices
  }, {
    'Métrica': 'Dispositivos en Línea',
    'Valor': data.generalStats.onlineDevices
  }, {
    'Métrica': 'Dispositivos Fuera de Línea',
    'Valor': data.generalStats.offlineDevices
  }, {
    'Métrica': 'Tiempo de Actividad Promedio',
    'Valor': formatUptime(data.generalStats.uptime)
  }, {
    'Métrica': 'Tiempo Promedio de Respuesta',
    'Valor': `${data.networkStats?.avgPingTime?.toFixed(2) || 0}ms`
  }];

  // 2. Análisis por Dispositivo
  const deviceData = data.deviceAnalysis
    .filter(device => device && device.name) // Filtrar dispositivos válidos
    .map(device => ({
      'Nombre': device.name,
      'IP': device.ip,
      'Tipo': device.type,
      'Estado Actual': device.currentStatus === 'online' ? 'En línea' : 'Fuera de línea',
      'Cambios de Estado': device.statusChanges || 0,
      'Incidentes Offline': device.offlineIncidents || 0,
      'Tiempo Total Offline': formatDuration(device.totalOfflineTime),
      'Uptime': formatUptime(device.uptime),
      'Intermitente': device.isIntermittent ? 'Sí' : 'No',
      'Última Conexión': formatDateForExcel(device.lastSeen)
    }));

  // 3. Análisis Temporal
  const timeData = data.timeAnalysis
    .filter(hour => hour && typeof hour.hour !== 'undefined')
    .map(hour => ({
      'Hora': `${hour.hour}:00`,
      'Total Eventos': hour.total || 0,
      'Desconexiones': hour.offline || 0,
      'Reconexiones': hour.online || 0
    }));

  // 4. Registro de Notificaciones
  const notificationData = data.notifications
    .filter(notif => notif && notif.timestamp)
    .map(notif => ({
      'Fecha y Hora': formatDateForExcel(notif.timestamp),
      'Tipo': notif.type === 'offline' ? 'Desconexión' : 
              notif.type === 'online' ? 'Reconexión' : 
              notif.type === 'warning' ? 'Advertencia' : 'Error',
      'Dispositivo': notif.deviceName || 'Sistema',
      'IP': notif.deviceIp || 'N/A',
      'Mensaje': notif.message
    }));

  // 5. Estadísticas de Red
  const networkData = [{
    'Métrica': 'Total de Escaneos',
    'Valor': data.networkStats?.totalScans || 0
  }, {
    'Métrica': 'Dispositivos Encontrados',
    'Valor': data.networkStats?.totalDevicesFound || 0
  }, {
    'Métrica': 'Nuevos Dispositivos',
    'Valor': data.networkStats?.totalNewDevices || 0
  }, {
    'Métrica': 'Tiempo de Respuesta Promedio',
    'Valor': `${data.networkStats?.avgPingTime?.toFixed(2) || 0}ms`
  }];

  // Crear hojas de trabajo
  const sheets = {
    'Resumen General': summaryData,
    'Análisis por Dispositivo': deviceData,
    'Análisis Temporal': timeData,
    'Registro de Notificaciones': notificationData,
    'Estadísticas de Red': networkData
  };

  // Añadir hojas al libro
  Object.entries(sheets).forEach(([name, sheetData]) => {
    if (sheetData && sheetData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, ws, name);
    }
  });

  // Configurar estilos y formato
  Object.keys(sheets).forEach(sheetName => {
    const ws = workbook.Sheets[sheetName];
    if (ws) {
      if (!ws['!cols']) {
        ws['!cols'] = Array(10).fill({ wch: 20 });
      }
    }
  });

  // Generar nombre de archivo
  const timeRangeText = timeRange === '24h' ? '24_horas' : 
                       timeRange === '7d' ? '7_dias' : '30_dias';
  const fileName = `estadisticas_${timeRangeText}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.xlsx`;

  // Exportar archivo
  XLSX.writeFile(workbook, fileName);
  return fileName;
};