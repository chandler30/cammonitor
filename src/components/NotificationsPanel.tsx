import { Fragment } from 'react';
import { format } from 'date-fns';
import {
  VideoCameraIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Notification {
  id: number;
  type: 'offline' | 'online' | 'error';
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
}

export default function NotificationsPanel({
  notifications,
  onClose,
  onMarkAsRead,
}: NotificationsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'offline':
        return (
          <div className="flex-shrink-0">
            <ExclamationCircleIcon
              className="h-6 w-6 text-red-400"
              aria-hidden="true"
            />
          </div>
        );
      case 'online':
        return (
          <div className="flex-shrink-0">
            <CheckCircleIcon
              className="h-6 w-6 text-green-400"
              aria-hidden="true"
            />
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <VideoCameraIcon
              className="h-6 w-6 text-gray-400"
              aria-hidden="true"
            />
          </div>
        );
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="py-1" role="menu" aria-orientation="vertical">
        <div className="px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
              >
                <div className="flex items-start">
                  {getIcon(notification.type)}
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.camera?.name || 'System'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {format(new Date(notification.timestamp), 'PPp')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}