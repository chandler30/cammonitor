import { Fragment } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  VideoCameraIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Notification {
  id: number;
  type: 'offline' | 'online' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
  camera?: {
    name: string;
    ip: string;
  };
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onNotificationsUpdate: () => void;
}

export default function NotificationsPanel({
  notifications,
  onClose,
  onMarkAsRead,
  onNotificationsUpdate,
}: NotificationsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'offline':
      case 'error':
        return (
          <div className="flex-shrink-0">
            <ExclamationCircleIcon
              className="h-6 w-6 text-red-400 dark:text-red-500"
              aria-hidden="true"
            />
          </div>
        );
      case 'online':
        return (
          <div className="flex-shrink-0">
            <CheckCircleIcon
              className="h-6 w-6 text-green-400 dark:text-green-500"
              aria-hidden="true"
            />
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0">
            <ExclamationCircleIcon
              className="h-6 w-6 text-amber-400 dark:text-amber-500"
              aria-hidden="true"
            />
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <VideoCameraIcon
              className="h-6 w-6 text-blue-400 dark:text-blue-500"
              aria-hidden="true"
            />
          </div>
        );
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    if (!read) return 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30';
    switch (type) {
      case 'offline':
      case 'error':
        return 'hover:bg-red-50 dark:hover:bg-red-900/20';
      case 'online':
        return 'hover:bg-green-50 dark:hover:bg-green-900/20';
      case 'warning':
        return 'hover:bg-amber-50 dark:hover:bg-amber-900/20';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-gray-800';
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Notificación eliminada');
      onNotificationsUpdate(); // Actualizar la lista de notificaciones
    } catch (error) {
      toast.error('Error al eliminar la notificación');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const promises = notifications.map(notification =>
        axios.delete(`http://localhost:5001/api/notifications/${notification.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      await Promise.all(promises);
      toast.success('Todas las notificaciones han sido eliminadas');
      onNotificationsUpdate(); // Actualizar la lista de notificaciones
    } catch (error) {
      toast.error('Error al eliminar las notificaciones');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => onMarkAsRead(n.id)));
      toast.success('Todas las notificaciones han sido marcadas como leídas');
    } catch (error) {
      toast.error('Error al marcar las notificaciones como leídas');
    }
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 ease-out">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="px-4 py-3 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
          <button
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-sm text-gray-500 dark:text-gray-400 text-center">
              <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${getNotificationBg(
                    notification.type,
                    notification.read
                  )} transition-colors duration-150 ease-in-out`}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-start">
                      {getIcon(notification.type)}
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.camera?.name || 'Sistema'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {format(new Date(notification.timestamp), "d 'de' MMMM 'a las' HH:mm", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0 flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
            <button
              onClick={markAllAsRead}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
            >
              Marcar todo como leído
            </button>
            <button
              onClick={deleteAllNotifications}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Eliminar todo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}