import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface IntermittencyBadgeProps {
  incidents: number;
  threshold?: number;
}

export default function IntermittencyBadge({ incidents, threshold = 5 }: IntermittencyBadgeProps) {
    if (!incidents || incidents <= threshold) return null;

  const severity = incidents > 10 ? 'severe' : 'moderate';

  return (
    <div className="group relative inline-block">
      <ExclamationTriangleIcon 
        className={`h-5 w-5 ${
          severity === 'severe' 
            ? 'text-red-500 animate-pulse' 
            : 'text-amber-500 animate-pulse'
        }`} 
      />
<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 top-full mt-2 -translate-x-1/2 max-w-xs z-50 pointer-events-none">
<div className="relative bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg text-sm border border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <p className={`font-medium ${
              severity === 'severe' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              ¡Alerta de Intermitencia!
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Este dispositivo ha presentado {incidents} desconexiones en las últimas 24 horas.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {severity === 'severe' 
                ? 'Se recomienda una revisión urgente del dispositivo.'
                : 'Se recomienda monitorear el dispositivo.'}
            </p>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 rotate-45"></div>
        </div>
      </div>
    </div>
  );
}
