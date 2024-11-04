import { COLORS } from '../constants/colors';

export const getChartConfig = (darkMode: boolean) => ({
  gridColor: darkMode ? 'rgba(229, 231, 235, 0.1)' : '#E5E7EB',
  textColor: darkMode ? '#9CA3AF' : '#6B7280',
  tooltipBg: darkMode ? '#374151' : '#FFFFFF',
  tooltipBorder: darkMode ? '#4B5563' : '#E5E7EB',
});

export const formatChartValue = (value: number, type: 'percentage' | 'time' | 'count') => {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'time':
      return `${value.toFixed(0)}ms`;
    default:
      return value.toString();
  }
};