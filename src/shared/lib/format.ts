/**
 * Utilidades de formato en español (es-MX). Las fechas de la API llegan como
 * `2026-10-12T16:00:00.000000Z` (microsegundos): se normalizan antes de parsear.
 */

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
const weekdayFormatter = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

const pad = (n: number) => String(n).padStart(2, '0');

/** Parsea ISO 8601 (con microsegundos) o `YYYY-MM-DD` en hora local. */
export function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
  }
  return new Date(value.replace(/(\.\d{3})\d+/, '$1'));
}

/** Fecha de un `YYYY-MM-DD` o ISO: `12 oct 2026`. */
export function formatDate(value: string): string {
  return dateFormatter.format(parseDate(value));
}

/** `12 oct 2026, 16:30`. */
export function formatDateTime(value: string): string {
  return `${formatDate(value)}, ${timeFormatter.format(parseDate(value))}`;
}

/** `16:30`. */
export function formatTime(value: string): string {
  return timeFormatter.format(parseDate(value));
}

/** `lunes, 12 de octubre`. */
export function formatWeekday(value: string): string {
  return weekdayFormatter.format(parseDate(value));
}

/** Moneda en pesos mexicanos por defecto (o la configurada en el negocio). */
export function formatMoney(value: number | null | undefined, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

/** Iniciales de un nombre (máx. 2 caracteres). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

/** Clave `YYYY-MM-DD` de una fecha en hora local. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Fecha de hoy como `YYYY-MM-DD`. */
export function todayDateValue(): string {
  return dateKey(new Date());
}

/** Suma días a hoy y devuelve `YYYY-MM-DD`. */
export function dateValueAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

/** Diferencia de días calendario entre una fecha y hoy (negativo = pasado). */
export function dayDiff(value: string): number {
  const target = parseDate(value);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const targetStart = new Date(target);
  targetStart.setHours(0, 0, 0, 0);
  return Math.round((targetStart.getTime() - start.getTime()) / 86_400_000);
}

/** `Hoy`, `Mañana`, `Ayer`, `En 3 días`, `Hace 2 días` o la fecha concreta. */
export function formatRelativeDay(value: string): string {
  const diff = dayDiff(value);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff <= 7) return `En ${diff} días`;
  if (diff < -1 && diff >= -7) return `Hace ${-diff} días`;
  return formatDate(value);
}

/** `hace 3 días`, `hace 2 h`… */
export function timeAgo(value: string): string {
  const ms = Date.now() - parseDate(value).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.round(months / 12);
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

/** ISO → valor de `<input type="datetime-local">` (hora local). */
export function toDateTimeLocalValue(iso: string): string {
  const date = parseDate(iso);
  return `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Valor de `datetime-local` (hora local) → ISO 8601 en UTC, como espera la API. */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

/** ISO → `YYYY-MM-DD` (para campos `date`). */
export function isoToDateValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return dateKey(parseDate(iso));
}

/** Primer y último día del mes de `base`, como `YYYY-MM-DD`. */
export function monthRange(base: Date): { from: string; to: string } {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { from: dateKey(first), to: dateKey(last) };
}

/** Clave de mes `YYYY-MM` de una fecha. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Desplaza un `YYYY-MM-DD` o ISO `n` días y devuelve `YYYY-MM-DD` (hora local). */
export function shiftDateValue(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
