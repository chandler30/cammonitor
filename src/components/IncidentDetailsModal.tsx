import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Incident {
  deviceId: number;
  deviceName: string;
  timestamp: string;
  type: string;
  duration?: number;
}

interface IncidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  incidents: Incident[];
}

export default function IncidentDetailsModal({
  isOpen,
  onClose,
  date,
  incidents,
}: IncidentDetailsModalProps) {
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-dark-card p-6 shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Incidentes del {format(new Date(date), 'PPP', { locale: es })}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flow-root">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {incidents.map((incident, index) => (
                        <li key={index} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${
                                incident.type === 'offline'
                                  ? 'bg-red-600'
                                  : 'bg-green-600'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {incident.deviceName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {incident.type === 'offline'
                                  ? 'Desconexión'
                                  : 'Reconexión'}{' '}
                                - {format(new Date(incident.timestamp), 'pp', {
                                  locale: es,
                                })}
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}