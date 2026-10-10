import type { RoleName, User } from '@/types';

/**
 * Roles de MediPlan y su pantalla de inicio. Si un usuario tiene varios roles,
 * gana el de mayor prioridad (administración > negocio > cliente).
 */

export const ROLE_PRIORITY: readonly RoleName[] = ['admin', 'business', 'client'];

export const ROLE_HOME: Record<RoleName, string> = {
  admin: '/admin',
  business: '/dashboard',
  client: '/cuenta',
};

export const ROLE_LABEL: Record<RoleName, string> = {
  admin: 'Administrador',
  business: 'Negocio',
  client: 'Cliente',
};

export function hasRole(user: User | null | undefined, role: RoleName): boolean {
  return Boolean(user?.roles.some((item) => item.name === role));
}

export function hasAnyRole(user: User | null | undefined, roles: readonly RoleName[]): boolean {
  return roles.some((role) => hasRole(user, role));
}

/** Rol principal del usuario según la prioridad, o `null` si no tiene ninguno. */
export function primaryRole(user: User | null | undefined): RoleName | null {
  return ROLE_PRIORITY.find((role) => hasRole(user, role)) ?? null;
}

/** Ruta de inicio para el rol principal del usuario. */
export function homePathForUser(user: User | null | undefined): string | null {
  const role = primaryRole(user);
  return role ? ROLE_HOME[role] : null;
}
