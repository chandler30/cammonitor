import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { toast } from 'react-toastify';
import {
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface ScanHistory {
  id: number;
  timestamp: string;
  devicesFound: number;
  newDevices: number;
}

interface Device {
  ip: string;
  type: string;
  lastSeen: string;
  status: 'online' | 'offline';
}

export default function Settings() {
  const [ipRange, setIpRange] = useState({
    startIp: '192.168.1.1',
    endIp: '192.168.1.254',
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [deviceTypes, setDeviceTypes] = useState<{ [ip: string]: string }>({});
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [persistedDevices, setPersistedDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [userRole, setUserRole] = useState<string>('user');
  const itemsPerPage = 10;
  const [scanProgress, setScanProgress] = useState({
    progress: 0,
    currentIp: '',
    status: '',
    pingTime: 0
  });

  const DEVICE_TYPES = [
    { value: 'camera', label: 'Cámara' },
    { value: 'NVR', label: 'NVR' },
    { value: 'switch', label: 'Switch de Red' },
    { value: 'router', label: 'Router' },
    { value: 'PC', label: 'Computadora' },
    { value: 'printer', label: 'Impresora' },
    { value: 'other', label: 'Otro' }
  ];

  useEffect(() => {
    const fetchUserRole = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const { role } = JSON.parse(userData);
        setUserRole(role);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [serverResponse, devicesResponse, historyResponse] = await Promise.all([
          axios.get('http://localhost:5001/api/network/ip', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/api/found-devices', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/api/network/scan-history', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setServerIp(serverResponse.data.ipAddress);
        setPersistedDevices(devicesResponse.data.data);
        setScanHistory(historyResponse.data.data);

        const types = {};
        devicesResponse.data.data.forEach((device) => {
          types[device.ip] = device.type || '';
        });
        setDeviceTypes(types);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Error al cargar los datos iniciales');
      }
    };

    fetchInitialData();

    const eventSource = new EventSource('http://localhost:5001/api/sse');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'scan_progress') {
        setScanProgress({
          progress: data.progress,
          currentIp: data.currentIp,
          status: data.status,
          pingTime: data.pingTime
        });
      } else if (data.type === 'scan_complete') {
        toast.success(`Escaneo completado: ${data.devicesFound} dispositivos encontrados (${data.newDevices} nuevos)`);
        fetchDevices();
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const [devicesResponse, historyResponse] = await Promise.all([
        axios.get('http://localhost:5001/api/found-devices', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5001/api/network/scan-history', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPersistedDevices(devicesResponse.data.data);
      setScanHistory(historyResponse.data.data);

      const types = {};
      devicesResponse.data.data.forEach((device) => {
        types[device.ip] = device.type || '';
      });
      setDeviceTypes(types);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Error al cargar los dispositivos');
    }
  };

  const scanNetwork = async () => {
    if (userRole !== 'admin') {
      toast.error('No tiene permisos para realizar esta acción');
      return;
    }

    try {
      setScanning(true);
      setError('');
      setScanProgress({
        progress: 0,
        currentIp: '',
        status: '',
        pingTime: 0
      });

      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5001/api/network/scan',
        {
          startIp: ipRange.startIp,
          endIp: ipRange.endIp,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error during network scan:', error);
      setError(error.response?.data?.message || 'Error en el escaneo de red');
      toast.error('Error al realizar el escaneo de red');
      setScanProgress({
        progress: 0,
        currentIp: '',
        status: '',
        pingTime: 0
      });
    } finally {
      setScanning(false);
    }
  };

  const updateDeviceType = async (ip: string, type: string) => {
    if (userRole !== 'admin') {
      toast.error('No tiene permisos para realizar esta acción');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5001/api/network/update-device-type',
        { ip, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeviceTypes((prev) => ({ ...prev, [ip]: type }));
      toast.success('Tipo de dispositivo actualizado');

      const devicesResponse = await axios.get(
        'http://localhost:5001/api/found-devices',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPersistedDevices(devicesResponse.data.data);
    } catch (error) {
      console.error('Error updating device type:', error);
      toast.error('Error al actualizar el tipo de dispositivo');
    }
  };

  const removeDevice = async (ip: string) => {
    if (userRole !== 'admin') {
      toast.error('No tiene permisos para realizar esta acción');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/network/devices/${ip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPersistedDevices((prev) => prev.filter((device) => device.ip !== ip));
      toast.success('Dispositivo eliminado correctamente');
    } catch (error) {
      console.error('Error removing device:', error);
      toast.error('Error al eliminar el dispositivo');
    }
  };

  const filteredDevices = persistedDevices.filter(device => {
    const matchesSearch = device.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviceTypes[device.ip]?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || deviceTypes[device.ip] === selectedType;
    const matchesStatus = selectedStatus === 'all' || device.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* IP del Servidor */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <ComputerDesktopIcon className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              IP del Servidor: {serverIp}
            </h3>
          </div>
        </div>
      </div>

      {/* Escáner de Red */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <GlobeAltIcon className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Escáner de Red
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {userRole === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IP Inicial
                </label>
                <input
                  type="text"
                  value={ipRange.startIp}
                  onChange={(e) =>
                    setIpRange({ ...ipRange, startIp: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IP Final
                </label>
                <input
                  type="text"
                  value={ipRange.endIp}
                  onChange={(e) =>
                    setIpRange({ ...ipRange, endIp: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="192.168.1.254"
                />
              </div>
            </div>
          )}

          {scanning && (
            <div className="mt-4 space-y-2">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 dark:text-blue-400 bg-blue-200 dark:bg-blue-900/50">
                      Progreso del escaneo
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                      {Math.round(scanProgress.progress)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200 dark:bg-blue-900/50">
                  <div
                    style={{ width: `${scanProgress.progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                  />
                </div>
                {scanProgress.currentIp && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>Escaneando: {scanProgress.currentIp}</p>
                    <p>Estado: {scanProgress.status === 'online' ? 'En línea' : 'Fuera de línea'}</p>
                    {scanProgress.status === 'online' && (
                      <p>Tiempo de respuesta: {scanProgress.pingTime.toFixed(2)}ms</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {userRole === 'admin' && (
            <div className="flex justify-end">
              <button
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                  scanning ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={scanNetwork}
                disabled={scanning}
              >
                {scanning && (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {scanning ? 'Escaneando...' : 'Escanear Red'}
              </button>
            </div>
          )}

          {/* Lista de Dispositivos */}
          {persistedDevices.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Dispositivos Encontrados
              </h4>
              
              {/* Filtros y Búsqueda */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar dispositivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  {DEVICE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="online">En línea</option>
                  <option value="offline">Fuera de línea</option>
                </select>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {paginatedDevices.length} de {filteredDevices.length} dispositivos
                </div>
              </div>

              {/* Tabla de Dispositivos */}
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Última vez visto</th>
                      {userRole === 'admin' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedDevices.map((device) => (
                      <tr key={device.ip} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {device.ip}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {userRole === 'admin' ? (
                            <select
                              value={deviceTypes[device.ip] || ''}
                              onChange={(e) => updateDeviceType(device.ip, e.target.value)}
                              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Seleccionar tipo</option>
                              {DEVICE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            DEVICE_TYPES.find(t => t.value === deviceTypes[device.ip])?.label || 'No especificado'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            device.status === 'online'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {device.status === 'online' ? 'En línea' : 'Fuera de línea'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(device.lastSeen).toLocaleString()}
                        </td>
                        {userRole === 'admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <button
                              onClick={() => removeDevice(device.ip)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notificaciones */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 text-purple-500 dark:text-purple-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preferencias de Notificación
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Notificaciones por Email
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recibir alertas por email sobre cambios de estado
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onChange={setEmailNotifications}
                className={`${
                  emailNotifications ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Notificaciones Push
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recibir notificaciones push para eventos críticos
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onChange={setPushNotifications}
                className={`${
                  pushNotifications ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    pushNotifications ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Seguridad */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-green-500 dark:text-green-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración de Seguridad
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Autenticación de Dos Factores
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Añadir una capa extra de seguridad a tu cuenta
                </p>
              </div>
              <Switch
  checked={twoFactorEnabled}
  onChange={setTwoFactorEnabled}
  className={`${
    twoFactorEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
>
  <span
    className={`${
      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
    } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
  />
</Switch>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}