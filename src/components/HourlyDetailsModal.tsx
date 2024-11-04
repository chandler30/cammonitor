import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Device {
  id: number;
  name: string;
  ip: string;
  status: string;
  statusChanges?: {
    timestamp: string;
    status: string;
  }[];
}

interface HourlyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hour: string;
  devices: Device[];
  onlineCount: number;
  offlineCount: number;
}

export default function HourlyDetailsModal({
  isOpen,
  onClose,
  hour,
  devices,
  onlineCount,
  offlineCount,
}: HourlyDetailsModalProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      Estado de Dispositivos - {hour}:00
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Total: {devices.length} dispositivos ({onlineCount} en línea, {offlineCount} fuera de línea)
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dispositivos En Línea */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                      Dispositivos En Línea ({onlineCount})
                    </h3>
                    <div className="space-y-3">
                      {devices
                        .filter(d => d.status === 'online')
                        .map(device => (
                          <div
                            key={device.id}
                            className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {device.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {device.ip}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <span className="h-2 w-2 rounded-full bg-green-400"></span>
                              </div>
                            </div>
                            {device.statusChanges && device.statusChanges.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <p className="font-medium mb-1">Cambios de estado:</p>
                                {device.statusChanges.map((change, idx) => (
                                  <p key={idx}>
                                    {formatTime(change.timestamp)} - {change.status === 'online' ? 'Conectado' : 'Desconectado'}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Dispositivos Fuera de Línea */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-3">
                      Dispositivos Fuera de Línea ({offlineCount})
                    </h3>
                    <div className="space-y-3">
                      {devices
                        .filter(d => d.status === 'offline')
                        .map(device => (
                          <div
                            key={device.id}
                            className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {device.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {device.ip}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <span className="h-2 w-2 rounded-full bg-red-400"></span>
                              </div>
                            </div>
                            {device.statusChanges && device.statusChanges.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <p className="font-medium mb-1">Cambios de estado:</p>
                                {device.statusChanges.map((change, idx) => (
                                  <p key={idx}>
                                    {formatTime(change.timestamp)} - {change.status === 'online' ? 'Conectado' : 'Desconectado'}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}