import { loadSession } from '@/shared/api/session';

/**
 * Identificador estable de la clínica (negocio). Se deriva del correo de la
 * cuenta para que la sincronización de WhatsApp sea consistente entre sesiones.
 */
export function clinicIdFromSession(): string {
  const session = loadSession();
  const raw = session?.user.email || (session?.user.id !== undefined ? String(session.user.id) : '') || 'local-clinic';
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'local-clinic';
}

/** Nombre visible del negocio; si la cuenta no tiene negocio, usa el nombre del usuario. */
export function clinicDisplayName(): string {
  const session = loadSession();
  return session?.user.business?.name || session?.user.name || 'Tu clínica';
}
