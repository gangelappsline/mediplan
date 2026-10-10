import { loadSession } from '@/features/auth/api';

/**
 * Identificador estable de la clínica. El login de demo genera un UUID nuevo
 * en cada entrada, así que la sincronización se ata al correo.
 */
export function clinicIdFromSession(): string {
  const session = loadSession();
  const raw = session?.user.email || session?.user.id || 'local-clinic';
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'local-clinic';
}

export function clinicDisplayName(): string {
  const session = loadSession();
  return session?.user.clinicName || session?.user.name || 'Tu clínica';
}
