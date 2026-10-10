const QUALITY: Record<string, string> = {
  GREEN: 'Alta',
  YELLOW: 'Media',
  RED: 'Baja',
  UNKNOWN: 'Sin datos',
};

const NAME_STATUS: Record<string, string> = {
  APPROVED: 'Aprobado',
  AVAILABLE_WITHOUT_REVIEW: 'Disponible',
  PENDING_REVIEW: 'En revisión',
  DECLINED: 'Rechazado',
  EXPIRED: 'Caducado',
  NONE: 'Sin nombre',
};

const ACCOUNT_STATUS: Record<string, string> = {
  CONNECTED: 'Conectado',
  PENDING: 'Pendiente',
  DISCONNECTED: 'Desconectado',
  FLAGGED: 'Marcado',
  RATE_LIMITED: 'Con límite',
  RESTRICTED: 'Restringido',
  BANNED: 'Bloqueado',
  MIGRATED: 'Migrado',
  UNVERIFIED: 'Sin verificar',
  DELETED: 'Eliminado',
};

const LIMITS: Record<string, string> = {
  TIER_50: '50 clientes únicos / 24 h',
  TIER_250: '250 clientes únicos / 24 h',
  TIER_1K: '1.000 clientes únicos / 24 h',
  TIER_1000: '1.000 clientes únicos / 24 h',
  TIER_2K: '2.000 clientes únicos / 24 h',
  TIER_10K: '10.000 clientes únicos / 24 h',
  TIER_100K: '100.000 clientes únicos / 24 h',
  TIER_UNLIMITED: 'Sin límite publicado',
};

const VERIFICATION: Record<string, string> = {
  verified: 'Verificado',
  not_verified: 'Sin verificar',
  pending: 'En revisión',
  pending_submission: 'Pendiente de envío',
  rejected: 'Rechazado',
  VERIFIED: 'Verificado',
  NOT_VERIFIED: 'Sin verificar',
  EXPIRED: 'Caducado',
};

export function labelOf(map: Record<string, string>, value: string | null | undefined, fallback = 'Sin datos'): string {
  if (!value) return fallback;
  return map[value] ?? map[value.toUpperCase()] ?? map[value.toLowerCase()] ?? value;
}

export function qualityLabel(value: string | null | undefined): string {
  return labelOf(QUALITY, value);
}

export function nameStatusLabel(value: string | null | undefined): string {
  return labelOf(NAME_STATUS, value);
}

export function accountStatusLabel(value: string | null | undefined): string {
  return labelOf(ACCOUNT_STATUS, value);
}

export function limitLabel(value: string | null | undefined): string {
  return labelOf(LIMITS, value, 'Meta no informó el límite');
}

export function verificationLabel(value: string | null | undefined): string {
  return labelOf(VERIFICATION, value);
}

export function qualityTone(value: string | null | undefined): string {
  switch (value?.toUpperCase()) {
    case 'GREEN':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'YELLOW':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-200';
    case 'RED':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatTokenExpiry(expiresAt: number | null): string {
  if (expiresAt === null) return 'No informado';
  if (expiresAt === 0) return 'No caduca';
  return formatWhen(new Date(expiresAt * 1000).toISOString());
}
