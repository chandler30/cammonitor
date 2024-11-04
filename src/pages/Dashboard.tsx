import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ExclamationTriangleIcon,
  ServerIcon,
  SignalIcon,
  ShieldCheckIcon,
  ClockIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import HourlyDetailsModal from '../components/HourlyDetailsModal';

interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  devicesByType: Record<string, number>;
}

interface ChartData {
  hour: string;
  online: number;
  offline: number;
  devices?: Array<{
    id: number;
    name: string;
    ip: string;
    status: string;
    statusChanges?: Array<{
      timestamp: string;
      status: string;
      duration?: number;
    }>;
    totalOfflineTime?: number;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  const hour = label;
  const data = payload[0]?.payload;
  const online = data?.online || 0;
  const offline = data?.offline || 0;
  const devicesWithIssues = data?.devices || [];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white text-base">
            {hour}:00 - {hour}:59
          </h3>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                En línea: {online}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Fuera de línea: {offline}
              </span>
            </div>
          </div>
        </div>

        {devicesWithIssues.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Dispositivos con actividad:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {devicesWithIssues.map((device: any, index: number) => (
                <div
                  key={`${device.id}-${index}`}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {device.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        device.status === 'online'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {device.status === 'online' ? 'En línea' : 'Fuera de línea'}
                    </span>
                  </div>
                  {device.statusChanges?.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {device.statusChanges.map((change: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-xs text-gray-600 dark:text-gray-400"
                        >
                          {new Date(change.timestamp).toLocaleTimeString()} -{' '}
                          {change.status === 'online' ? 'Conectado' : 'Desconectado'}
                          {change.duration > 0 &&
                            ` (${change.duration} ${
                              change.duration === 1 ? 'minuto' : 'minutos'
                            })`}
                        </div>
                      ))}
                    </div>
                  )}
                  {device.totalOfflineTime > 0 && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Tiempo total fuera de línea: {device.totalOfflineTime} minutos
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          Click para ver más detalles
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState<ChartData[]>([]);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [hourlyDevices, setHourlyDevices] = useState<any[]>([]);
  const [isHourlyModalOpen, setIsHourlyModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    devicesByType: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [foundDevicesResponse, historyResponse] = await Promise.all([
          axios.get('http://localhost:5001/api/found-devices', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/api/cameras/history', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Procesar datos de dispositivos
        const devices = foundDevicesResponse.data.data.filter(device => device.type);
        const devicesByType = devices.reduce((acc, device) => {
          if (device.type) {
            acc[device.type] = (acc[device.type] || 0) + 1;
          }
          return acc;
        }, {});

        setStats({
          totalDevices: devices.length,
          onlineDevices: devices.filter(d => d.status === 'online').length,
          offlineDevices: devices.filter(d => d.status === 'offline').length,
          devicesByType,
        });

        // Procesar datos históricos
        setData(historyResponse.data.data);
        setLastUpdate(new Date());
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error al cargar los datos del panel');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const hour = data.activePayload[0].payload.hour;
      setSelectedHour(hour);
      setHourlyDevices(data.activePayload[0].payload.devices || []);
      setIsHourlyModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-900 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const uptimePercentage = stats.totalDevices > 0
    ? ((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitoreo en tiempo real del sistema</p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
          <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Dispositivos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalDevices}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <ServerIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Dispositivos registrados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Dispositivos Activos</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.onlineDevices}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <SignalIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">En línea ahora</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Dispositivos Inactivos</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.offlineDevices}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Requieren atención</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Tiempo de Actividad</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{uptimePercentage}%</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 rounded-full h-2 transition-all duration-500"
                style={{ width: `${uptimePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Estado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Estado en las Últimas 24 Horas
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={data}
              onClick={handleChartClick}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (value === 'online' ? 'En línea' : 'Fuera de línea')}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="online"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOnline)"
                name="online"
                activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="offline"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOffline)"
                name="offline"
                activeDot={{ r: 6, stroke: '#DC2626', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal de detalles por hora */}
      {selectedHour && (
        <HourlyDetailsModal
          isOpen={isHourlyModalOpen}
          onClose={() => setIsHourlyModalOpen(false)}
          hour={selectedHour}
          devices={hourlyDevices}
          onlineCount={hourlyDevices.filter(d => d.status === 'online').length}
          offlineCount={hourlyDevices.filter(d => d.status === 'offline').length}
        />
      )}
    </div>
  );
}