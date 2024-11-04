import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { BellIcon } from '@heroicons/react/24/outline';
import UserProfile from './UserProfile';
import NotificationsPanel from './NotificationsPanel';
import ThemeToggle from './ThemeToggle';
import axios from 'axios';
import { toast } from 'react-toastify';

interface LayoutProps {
  children: ReactNode;
}

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

export default function Layout({ children }: LayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      setUnreadCount(response.data.data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error al cargar las notificaciones');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Actualizar cada 30 segundos
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
      toast.success('Notificación marcada como leída');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar la notificación como leída');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar para pantallas grandes */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Sidebar móvil */}
      <div className={`md:hidden ${isSidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-50`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
        <div className="relative w-64">
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            {/* Botón de menú móvil */}
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sistema de Monitoreo de Cámaras
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150"
                >
                  <span className="sr-only">Ver notificaciones</span>
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center transform -translate-y-1/2 translate-x-1/2 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 transform transition-all duration-200 ease-out">
                    <NotificationsPanel
                      notifications={notifications}
                      onClose={() => setShowNotifications(false)}
                      onMarkAsRead={markAsRead}
                      onNotificationsUpdate={fetchNotifications}
                    />
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
              <ThemeToggle />
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
              <UserProfile />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
          <div className="container mx-auto max-w-7xl">
            <div className="transition-all duration-200 ease-in-out">
              {children}
            </div>
          </div>
        </main>

        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 transition-colors duration-200">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} CamMonitor. Todos los derechos reservados.
          </div>
        </footer>
      </div>
    </div>
  );
}