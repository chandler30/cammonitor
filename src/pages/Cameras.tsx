import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon as SearchIcon,
  ClockIcon,
  EyeIcon,
  VideoCameraIcon,
  ServerIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

import IntermittencyBadge from '../components/IntermittencyBadge';
import DeviceDetailsModal from '../components/DeviceDetailsModal';

interface Device {
  id: number;
  ip: string;
  status: 'online' | 'offline';
  lastSeen: string;
  type: string;
  name: string;
  incidents?: number;
}

interface Stats {
  total: number;
  online: number;
  offline: number;
}

export default function Cameras() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [userRole, setUserRole] = useState<string>('user');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    online: 0,
    offline: 0,
  });

  const itemsPerPage = 10;

  const deviceTypes = [
    { value: 'camera', label: 'Cámara' },
    { value: 'NVR', label: 'NVR' },
    { value: 'switch', label: 'Switch' },
    { value: 'router', label: 'Router' },
    { value: 'PC', label: 'Computadora' },
    { value: 'printer', label: 'Impresora' },
    { value: 'other', label: 'Otro' },
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
    fetchDevices();
    const interval = setInterval(fetchDevices, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/cameras', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const devicesData = response.data.data;
      setDevices(devicesData);
      setLastUpdate(new Date());

      // Actualizar estadísticas
      setStats({
        total: devicesData.length,
        online: devicesData.filter((d: Device) => d.status === 'online').length,
        offline: devicesData.filter((d: Device) => d.status === 'offline').length,
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Error al cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (device: Device) => {
    setEditingId(device.id);
    setEditName(device.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveDeviceName = async (device: Device) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5001/api/cameras/${device.id}/name`,
        { name: editName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDevices(devices.map(d => 
        d.id === device.id ? { ...d, name: editName } : d
      ));
      setEditingId(null);
      setEditName('');
      toast.success('Nombre actualizado correctamente');
    } catch (error) {
      console.error('Error updating device name:', error);
      toast.error('Error al actualizar el nombre');
    }
  };

  const openDeviceDetails = (device: Device) => {
    setSelectedDevice(device);
    setIsDetailsModalOpen(true);
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || device.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || device.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dispositivos de Red
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión y monitoreo de dispositivos
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
          <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-blue-100">Total Dispositivos</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <VideoCameraIcon className="h-8 w-8 text-blue-100" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-green-100">En Línea</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.online}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-400 bg-opacity-20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-100 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl shadow-lg p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-red-100">Fuera de Línea</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.offline}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-400 bg-opacity-20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-red-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre o IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
            <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todos los tipos</option>
            {deviceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="online">En línea</option>
            <option value="offline">Fuera de línea</option>
          </select>
        </div>

        {/* Tabla de Dispositivos */}
        <div className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre/IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Última Actividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : paginatedDevices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron dispositivos
                    </td>
                  </tr>
                ) : (
                  paginatedDevices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            {editingId === device.id && userRole === 'admin' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                                <button
                                  onClick={() => saveDeviceName(device)}
                                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {device.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {device.ip}
                                  </p>
                                </div>
                                {userRole === 'admin' && (
                                  <button
                                    onClick={() => startEditing(device)}
                                    className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                )}
                                {device.incidents && device.incidents > 5 && (
                                  <IntermittencyBadge incidents={device.incidents} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {deviceTypes.find(t => t.value === device.type)?.label || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            device.status === 'online'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {device.status === 'online' ? 'En línea' : 'Fuera de línea'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(device.lastSeen).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openDeviceDetails(device)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredDevices.length)} de{' '}
              {filteredDevices.length} dispositivos
            </div>
            <div className="flex space-x-2">
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
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedDevice && (
        <DeviceDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          device={selectedDevice}
        />
      )}
    </div>
  );
}