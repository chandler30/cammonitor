import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  onDeviceClick?: (deviceId: number) => void;
  devices?: any[];
}

export default function ChartTooltip({ active, payload, label, onDeviceClick, devices }: ChartTooltipProps) {
  if (!active || !payload) return null;

  const hour = parseInt(label || '0');
  const formattedTime = `${hour.toString().padStart(2, '0')}:00`;

  const onlineCount = payload.find(p => p.name === 'online')?.value || 0;
  const offlineCount = payload.find(p => p.name === 'offline')?.value || 0;

  return (
    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {formattedTime}
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-green-600 dark:text-green-400">En línea:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{onlineCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-red-600 dark:text-red-400">Fuera de línea:</span>
          <span className="font-semibold text-red-600 dark:text-red-400">{offlineCount}</span>
        </div>
      </div>
      {devices && devices.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dispositivos
          </h4>
          <div className="max-h-40 overflow-y-auto">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => onDeviceClick?.(device.id)}
                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-gray-100">{device.name}</span>
                  <span className={device.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {device.status === 'online' ? '●' : '○'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}