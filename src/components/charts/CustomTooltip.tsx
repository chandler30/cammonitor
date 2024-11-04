import { formatDateTime, formatTimeRange } from '../../utils/dateUtils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;

  const data = payload[0]?.payload;
  const online = data?.online || 0;
  const offline = data?.offline || 0;
  const devices = data?.devices || [];
  const originalHour = data?.originalHour;

  // Crear fechas ajustadas a Colombia
  const baseDate = new Date();
  baseDate.setHours(originalHour, 0, 0, 0);
  
  // Crear fecha de fin (1 hora después)
  const endDate = new Date(baseDate);
  endDate.setHours(endDate.getHours() + 1);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white text-base">
            {formatTimeRange(baseDate, endDate)}
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                En línea: {online}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Fuera de línea: {offline}
              </span>
            </div>
          </div>
        </div>

        {devices.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Dispositivos con actividad:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {devices.map((device: any, index: number) => (
                <div
                  key={`${device.id}-${index}`}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {device.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        device.status === 'online'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {device.status === 'online' ? 'En línea' : 'Fuera de línea'}
                    </span>
                  </div>
                  {device.statusChanges?.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {device.statusChanges.map((change: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-xs text-gray-600 dark:text-gray-400"
                        >
                          {formatDateTime(change.timestamp)} -{' '}
                          {change.status === 'online' ? 'Conectado' : 'Desconectado'}
                          {change.duration > 0 &&
                            ` (${change.duration} ${
                              change.duration === 1 ? 'minuto' : 'minutos'
                            })`}
                        </div>
                      ))}
                    </div>
                  )}
                  {device.totalOfflineTime > 0 && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Tiempo total fuera de línea: {device.totalOfflineTime} minutos
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          Click para ver más detalles
        </div>
      </div>
    </div>
  );
};