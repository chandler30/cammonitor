import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface DeviceDetails {
  uptime: number;
  avgResponseTime: number;
  lastOffline: string | null;
  totalIncidents: number;
  offlineIncidents: number;
  responseTimeHistory: {
    timestamp: string;
    value: number;
  }[];
  incidentHistory: {
    timestamp: string;
    type: string;
    duration?: number;
  }[];
}

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: {
    id: number;
    name: string;
    ip: string;
    type: string;
    status: string;
  };
}

export default function DeviceDetailsModal({
  isOpen,
  onClose,
  device,
}: DeviceDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<DeviceDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDeviceDetails();
    }
  }, [isOpen, device.id]);

  const fetchDeviceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/cameras/${device.id}/details`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching device details:', error);
      setError('Error al cargar los detalles del dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online'
      ? 'text-green-600 bg-green-100'
      : 'text-red-600 bg-red-100';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}${
      remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''
    }`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Detalles del Dispositivo
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : error ? (
                  <div className="mt-4 bg-red-50 p-4 rounded-md">
                    <p className="text-red-700">{error}</p>
                  </div>
                ) : details ? (
                  <div className="mt-4 space-y-6">
                    {/* Información básica */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Información General
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="font-medium">{device.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Dirección IP</p>
                          <p className="font-medium">{device.ip}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tipo</p>
                          <p className="font-medium capitalize">{device.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Estado</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              device.status
                            )}`}
                          >
                            {device.status === 'online'
                              ? 'En línea'
                              : 'Fuera de línea'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas de rendimiento */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Estadísticas de Rendimiento
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Tiempo de actividad
                          </p>
                          <p className="font-medium">{details.uptime.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Tiempo de respuesta promedio
                          </p>
                          <p className="font-medium">
                            {details.avgResponseTime.toFixed(0)} ms
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Total de incidentes
                          </p>
                          <p className="font-medium">{details.totalIncidents}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Incidentes fuera de línea
                          </p>
                          <p className="font-medium">{details.offlineIncidents}</p>
                        </div>
                      </div>
                    </div>

                    {/* Historial de incidentes */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Últimos Incidentes
                      </h3>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <div className="flow-root">
                          <ul className="divide-y divide-gray-200">
                            {details.incidentHistory.map((incident, index) => (
                              <li key={index} className="p-4">
                                <div className="flex items-center space-x-4">
                                  <div
                                    className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${
                                      incident.type === 'offline'
                                        ? 'bg-red-600'
                                        : 'bg-green-600'
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                      {incident.type === 'offline'
                                        ? 'Desconexión'
                                        : 'Reconexión'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(
                                        incident.timestamp
                                      ).toLocaleString()}
                                      {incident.duration &&
                                        ` - Duración: ${formatDuration(
                                          incident.duration
                                        )}`}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Recomendaciones */}
                    {details.offlineIncidents > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-800 mb-2">
                          Recomendaciones de Mantenimiento
                        </h3>
                        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                          {details.avgResponseTime > 100 && (
                            <li>
                              El tiempo de respuesta es elevado. Se recomienda
                              verificar la conexión de red.
                            </li>
                          )}
                          {details.offlineIncidents > 5 && (
                            <li>
                              El dispositivo presenta desconexiones frecuentes.
                              Revisar la alimentación eléctrica y conexión de red.
                            </li>
                          )}
                          {details.uptime < 90 && (
                            <li>
                              El tiempo de actividad es bajo. Se sugiere una
                              revisión general del equipo.
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}