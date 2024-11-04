import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../../constants/colors';
import { CustomTooltip } from './CustomTooltip';
import { formatHour, getCurrentHour } from '../../utils/dateUtils';

interface TimelineChartProps {
  data: any[];
  onHourClick?: (hour: string, devices: any[]) => void;
}

export const TimelineChart = ({ data, onHourClick }: TimelineChartProps) => {
  const currentHour = getCurrentHour();

  // Ajustar los datos para mostrar las últimas 24 horas desde la hora actual
  const formattedData = Array.from({ length: 24 }, (_, index) => {
    // Calcular la hora correcta teniendo en cuenta el offset
    const hour = (currentHour - 23 + index + 24) % 24;
    
    // Buscar los datos existentes para esta hora
    const existingData = data.find(item => parseInt(item.hour) === hour) || {
      hour: hour.toString().padStart(2, '0'),
      online: 0,
      offline: 0,
      devices: []
    };

    // Formatear la hora para mostrar
    const formattedHour = formatHour(hour);

    return {
      ...existingData,
      hour: formattedHour,
      displayHour: formattedHour,
      originalHour: hour
    };
  });

  const handleClick = (data: any) => {
    if (onHourClick && data && data.activePayload) {
      const hourData = data.activePayload[0].payload;
      onHourClick(hourData.displayHour, hourData.devices || []);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart 
        data={formattedData}
        onClick={handleClick}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.green.light} stopOpacity={0.1}/>
            <stop offset="95%" stopColor={COLORS.green.light} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.red.light} stopOpacity={0.1}/>
            <stop offset="95%" stopColor={COLORS.red.light} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false}
          className="dark:opacity-20"
        />
        <XAxis
          dataKey="displayHour"
          interval={2}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 12 }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ stroke: '#6B7280', strokeWidth: 1 }}
        />
        <Legend
          formatter={(value) => value === 'online' ? 'En línea' : 'Fuera de línea'}
          iconType="circle"
          wrapperStyle={{ paddingTop: '20px' }}
        />
        <Area
          type="monotone"
          dataKey="online"
          name="online"
          stroke={COLORS.green.light}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorOnline)"
          activeDot={{ 
            r: 6, 
            stroke: COLORS.green.dark, 
            strokeWidth: 2,
            fill: COLORS.green.light 
          }}
        />
        <Area
          type="monotone"
          dataKey="offline"
          name="offline"
          stroke={COLORS.red.light}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorOffline)"
          activeDot={{ 
            r: 6, 
            stroke: COLORS.red.dark, 
            strokeWidth: 2,
            fill: COLORS.red.light 
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};