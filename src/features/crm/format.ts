/**
 * Utilidades de formato para el CRM: fechas relativas en español, moneda
 * (USD, como los precios de la landing) e iniciales para avatares.
 */

const dateFormatter = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
});

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Parsea fechas de forma consistente: las cadenas `YYYY-MM-DD` (fechas de solo
 * día como nacimiento o cierre esperado) se interpretan en hora local al
 * mediodía para evitar desfases por zona horaria.
 */
function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
  }
  return new Date(value);
}

/** `2026-10-12` (acepta ISO o `YYYY-MM-DD`). */
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

/** `US$1,200`. */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Iniciales de un nombre (máx. 2 caracteres): "Ana García" → "AG". */
export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/** Diferencia de días calendario entre una fecha y hoy (negativo = pasado). */
export function dayDiff(value: string): number {
  const target = startOfDay(parseDate(value)).getTime();
  const today = startOfDay(new Date()).getTime();
  return Math.round((target - today) / 86_400_000);
}

/**
 * Fecha relativa corta en español para vencimientos y seguimientos:
 * "Hoy", "Mañana", "Ayer", "En 3 días", "Hace 2 días" o la fecha concreta.
 */
export function formatRelativeDay(value: string): string {
  const diff = dayDiff(value);

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff <= 7) return `En ${diff} días`;
  if (diff < -1 && diff >= -7) return `Hace ${-diff} días`;

  return formatDate(value);
}

/** Tiempo transcurrido desde una fecha: "hace 3 días", "hace 2 horas"… */
export function timeAgo(value: string): string {
  const ms = Date.now() - new Date(value).getTime();
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

/** Convierte un ISO a valor de `<input type="datetime-local">`. */
export function toDateTimeLocalValue(iso: string): string {
  const date = parseDate(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convierte un valor `datetime-local` a ISO. */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

/** Fecha de hoy como `YYYY-MM-DD`. */
export function todayDateValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Suma días a una fecha ISO y devuelve `YYYY-MM-DD`. */
export function dateValueAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateTimeLocalValue(date.toISOString()).slice(0, 10);
}
