import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ArrowDownTrayIcon,
  ClockIcon,
  VideoCameraIcon,
  ServerIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { COLORS } from '../constants/colors';
import { TimelineChart } from '../components/charts/TimelineChart';
import { DeviceTypeChart } from '../components/charts/DeviceTypeChart';
import { DevicePerformanceChart } from '../components/charts/DevicePerformanceChart';
import { DeviceIssuesTable } from '../components/tables/DeviceIssuesTable';
import { exportToExcel } from '../utils/exportUtils';
import { formatDateTime } from '../utils/dateUtils';

export default function Statistics() {
  const [data, setData] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [exportLoading, setExportLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/statistics/detailed?range=${selectedTimeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData(response.data.data);
      setLastUpdate(new Date());
      toast.success('Estadísticas actualizadas');
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const fileName = exportToExcel(data, selectedTimeRange);
      toast.success(`Informe exportado: ${fileName}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar el informe');
    } finally {
      setExportLoading(false);
    }
  };

  const deviceTypeData = useMemo(() => {
    if (!data?.deviceAnalysis) return [];
    const typeCount: { [key: string]: number } = {};
    data.deviceAnalysis.forEach((device: any) => {
      const type = device.type === 'camera' ? 'Cámara' :
                   device.type === 'NVR' ? 'NVR' :
                   device.type === 'switch' ? 'Switch' :
                   device.type === 'router' ? 'Router' :
                   device.type === 'PC' ? 'PC' :
                   device.type === 'printer' ? 'Impresora' : 'Otro';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data?.deviceAnalysis]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Estadísticas del Sistema
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Análisis detallado del rendimiento
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-5 w-5" />
            <span>Actualizado: {formatDateTime(lastUpdate)}</span>
          </div>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
          >
            {exportLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
            ) : (
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            )}
            Exportar Informe
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`bg-gradient-to-br ${COLORS.blue.bg} ${COLORS.blue.bgDark} rounded-xl shadow-lg p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100">Dispositivos Totales</p>
              <p className="text-3xl font-bold mt-2">
                {data?.generalStats.totalDevices}
              </p>
            </div>
            <VideoCameraIcon className="h-8 w-8 text-blue-100" />
          </div>
          <p className="mt-4 text-blue-100">
            {data?.generalStats.onlineDevices} en línea
          </p>
        </div>

        <div className={`bg-gradient-to-br ${COLORS.green.bg} ${COLORS.green.bgDark} rounded-xl shadow-lg p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100">Tiempo de Actividad</p>
              <p className="text-3xl font-bold mt-2">
                {data?.generalStats.uptime.toFixed(1)}%
              </p>
            </div>
            <ServerIcon className="h-8 w-8 text-emerald-100" />
          </div>
          <div className="mt-4">
            <div className="bg-emerald-200 bg-opacity-25 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${data?.generalStats.uptime}%` }}
              />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${COLORS.amber.bg} ${COLORS.amber.bgDark} rounded-xl shadow-lg p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100">Tiempo de Respuesta</p>
              <p className="text-3xl font-bold mt-2">
                {data?.networkStats.avgPingTime?.toFixed(0) || 0}
                <span className="text-lg">ms</span>
              </p>
            </div>
            <ArrowPathIcon className="h-8 w-8 text-amber-100" />
          </div>
          <p className="mt-4 text-amber-100">Promedio de latencia</p>
        </div>

        <div className={`bg-gradient-to-br ${COLORS.red.bg} ${COLORS.red.bgDark} rounded-xl shadow-lg p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100">Incidentes</p>
              <p className="text-3xl font-bold mt-2">
                {data?.deviceAnalysis.reduce((acc: number, device: any) => acc + device.offlineIncidents, 0)}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-100" />
          </div>
          <p className="mt-4 text-red-100">Total de desconexiones</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Línea de Tiempo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Actividad en el Tiempo
          </h3>
          <TimelineChart data={data?.timeAnalysis || []} />
        </div>

        {/* Distribución de Dispositivos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Distribución por Tipo
          </h3>
          <DeviceTypeChart data={deviceTypeData} />
        </div>

        {/* Rendimiento por Dispositivo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Top 10 Dispositivos por Incidentes
          </h3>
          <DevicePerformanceChart data={data?.deviceAnalysis || []} />
        </div>
      </div>

      {/* Tabla de Dispositivos con Problemas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Dispositivos con Problemas de Conectividad
        </h3>
        <DeviceIssuesTable devices={data?.deviceAnalysis || []} />
      </div>
    </div>
  );
}