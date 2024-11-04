import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  VideoCameraIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

const navigation = [
  { name: 'Panel Principal', href: '/', icon: HomeIcon },
  { name: 'Cámaras', href: '/cameras', icon: VideoCameraIcon },
  { name: 'Estadísticas', href: '/statistics', icon: ChartBarIcon },
  { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 shadow-xl transition-colors duration-200">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800">
          <div className="flex items-center space-x-3">
            <VideoCameraIcon className="h-8 w-8 text-white" />
            <span className="text-white text-xl font-bold">CamMonitor</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  twMerge(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="text-xs text-gray-400">
              Estado del Sistema: <span className="text-green-400">Activo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}