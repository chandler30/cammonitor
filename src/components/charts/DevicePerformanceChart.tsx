import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../../constants/colors';
import { CustomTooltip } from './CustomTooltip';

interface DevicePerformanceChartProps {
  data: any[];
}

export const DevicePerformanceChart = ({ data }: DevicePerformanceChartProps) => {
  // Filtrar solo dispositivos con incidentes
  const filteredData = data.filter(device => device.incidentes > 0)
    .sort((a, b) => b.incidentes - a.incidentes)
    .slice(0, 10);

  return filteredData.length > 0 ? (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis yAxisId="left" orientation="left" stroke={COLORS.red.light} />
        <YAxis yAxisId="right" orientation="right" stroke={COLORS.blue.light} />
        <Tooltip content={<CustomTooltip type="percentage" />} />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="incidentes"
          name="Incidentes"
          fill={COLORS.red.light}
        />
        <Bar
          yAxisId="right"
          dataKey="uptime"
          name="Uptime (%)"
          fill={COLORS.blue.light}
        />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p className="text-gray-500 dark:text-gray-400">
        No hay dispositivos con incidentes en este período
      </p>
    </div>
  );
};