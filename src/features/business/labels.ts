import type { AppointmentStatusName, ClientStatusName, DayKey, LeadStatusName } from '@/types';

export const LEAD_STATUS_OPTIONS: ReadonlyArray<{ value: LeadStatusName; label: string }> = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'proposal', label: 'Propuesta' },
  { value: 'won', label: 'Ganado' },
  { value: 'lost', label: 'Perdido' },
];

export const LEAD_STATUS_LABEL: Record<LeadStatusName, string> = Object.fromEntries(
  LEAD_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<LeadStatusName, string>;

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatusName, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

export const APPOINTMENT_STATUS_OPTIONS: ReadonlyArray<{ value: AppointmentStatusName; label: string }> = (
  Object.keys(APPOINTMENT_STATUS_LABEL) as AppointmentStatusName[]
).map((value) => ({ value, label: APPOINTMENT_STATUS_LABEL[value] }));

export const CLIENT_STATUS_OPTIONS: ReadonlyArray<{ value: ClientStatusName; label: string }> = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

export const LEAD_SOURCE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sitio_web', label: 'Sitio web' },
  { value: 'referencia', label: 'Referencia' },
  { value: 'llamada', label: 'Llamada' },
  { value: 'otro', label: 'Otro' },
];

export const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const DAY_KEYS: readonly DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const TIMEZONE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (America/Mexico_City)' },
  { value: 'America/Monterrey', label: 'Monterrey (America/Monterrey)' },
  { value: 'America/Tijuana', label: 'Tijuana (America/Tijuana)' },
  { value: 'America/Cancun', label: 'Cancún (America/Cancun)' },
  { value: 'America/Bogota', label: 'Bogotá (America/Bogota)' },
  { value: 'America/Lima', label: 'Lima (America/Lima)' },
  { value: 'America/Santiago', label: 'Santiago (America/Santiago)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (America/Buenos_Aires)' },
  { value: 'America/New_York', label: 'Nueva York (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (America/Los_Angeles)' },
  { value: 'Europe/Madrid', label: 'Madrid (Europe/Madrid)' },
  { value: 'UTC', label: 'UTC' },
];

export const CURRENCY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'MXN', label: 'MXN · Peso mexicano' },
  { value: 'USD', label: 'USD · Dólar estadounidense' },
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'COP', label: 'COP · Peso colombiano' },
  { value: 'ARS', label: 'ARS · Peso argentino' },
  { value: 'CLP', label: 'CLP · Peso chileno' },
  { value: 'PEN', label: 'PEN · Sol peruano' },
];
