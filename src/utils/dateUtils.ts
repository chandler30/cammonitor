import { format, parseISO, formatISO, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

// Colombia está en UTC-5, entonces necesitamos ajustar 5 horas hacia atrás
const COLOMBIA_OFFSET = -5;

export const formatDateTime = (date: string | Date) => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(addHours(parsedDate, COLOMBIA_OFFSET), 'PPpp', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
};

export const formatHour = (hour: string | number) => {
  try {
    // Convertir la hora a número
    let numHour = typeof hour === 'string' ? parseInt(hour) : hour;
    
    // Ajustar la hora a Colombia
    numHour = (numHour + 24 + COLOMBIA_OFFSET) % 24;
    
    // Formatear la hora
    return `${numHour.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error formatting hour:', error);
    return `${hour}:00`;
  }
};

export const formatDuration = (minutes: number) => {
  if (!minutes || isNaN(minutes)) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h ${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
};

export const getCurrentHour = () => {
  const now = new Date();
  // Ajustar la hora actual a Colombia
  const colombiaHour = (now.getUTCHours() + 24 + COLOMBIA_OFFSET) % 24;
  return colombiaHour;
};

export const getLocalTimeZoneOffset = () => {
  return COLOMBIA_OFFSET * 60; // Convertir a minutos para mantener compatibilidad
};

export const formatDateForExcel = (date: string | Date | null) => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(addHours(parsedDate, COLOMBIA_OFFSET), 'dd/MM/yyyy HH:mm:ss');
  } catch (error) {
    console.error('Error formatting date for Excel:', error);
    return '';
  }
};

export const formatTimeRange = (startDate: Date, endDate: Date) => {
  const colombiaStartDate = addHours(startDate, COLOMBIA_OFFSET);
  const colombiaEndDate = addHours(endDate, COLOMBIA_OFFSET);
  return `${format(colombiaStartDate, 'HH:mm')} - ${format(colombiaEndDate, 'HH:mm')}`;
};