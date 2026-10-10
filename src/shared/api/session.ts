import type { User } from '@/types';

/**
 * Sesión persistida en `localStorage`. Guarda el token Passport y el usuario
 * devuelto por `POST /login`, `POST /register` o `GET /me`.
 *
 * Se mantiene una copia en memoria para que `useSyncExternalStore` reciba una
 * referencia estable (y no provoque renders infinitos).
 */

export const SESSION_STORAGE_KEY = 'mediplan-auth';

export interface StoredSession {
  token: string;
  user: User;
}

type Listener = () => void;

const listeners = new Set<Listener>();

function readFromStorage(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed.token || !parsed.user) return null;
    return { token: parsed.token, user: parsed.user };
  } catch {
    return null;
  }
}

let current: StoredSession | null = readFromStorage();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Sesión actual (referencia estable mientras no cambie). */
export function getSession(): StoredSession | null {
  return current;
}

/** Token Bearer actual, si hay sesión. */
export function getToken(): string | null {
  return current?.token ?? null;
}

/** Guarda una sesión nueva o actualiza el usuario de la existente. */
export function saveSession(session: StoredSession): void {
  current = session;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Almacenamiento no disponible (modo privado): la sesión vive en memoria.
  }
  notify();
}

/** Elimina la sesión (logout o token expirado). */
export function clearSession(): void {
  current = null;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Sin almacenamiento disponible: nada que limpiar.
  }
  notify();
}

/** Suscripción para `useSyncExternalStore`. */
export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Recupera la sesión persistida (compatibilidad con código no reactivo). */
export function loadSession(): StoredSession | null {
  return current;
}
