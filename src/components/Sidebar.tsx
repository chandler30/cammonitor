import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  VideoCameraIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Cameras', href: '/cameras', icon: VideoCameraIcon },
  { name: 'Statistics', href: '/statistics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-xl">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-800">
          <span className="text-white text-xl font-bold">CamMonitor</span>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  twMerge(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 bg-gray-800">
          <div className="text-xs text-gray-400">
            System Status: <span className="text-green-400">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}