import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { BellIcon } from '@heroicons/react/24/outline';
import UserProfile from './UserProfile';
import NotificationsPanel from './NotificationsPanel';
import axios from 'axios';

interface LayoutProps {
  children: ReactNode;
}

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

export default function Layout({ children }: LayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5001/api/notifications',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotifications(response.data.data);
        setUnreadCount(
          response.data.data.filter((n: Notification) => !n.read).length
        );
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Polling cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5001/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Camera Monitoring System
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center transform -translate-y-1/2 translate-x-1/2">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationsPanel
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkAsRead={markAsRead}
                  />
                )}
              </div>
              <UserProfile />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="container mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}