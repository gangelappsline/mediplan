import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';

/**
 * Servicio de autenticación simulado (sin backend real).
 *
 * Todas las llamadas se resuelven con `setTimeout` para imitar la latencia de
 * una API. La sesión se persiste en `localStorage` para que el placeholder de
 * `/dashboard` pueda mostrar los datos del usuario.
 *
 * Demo: usa el email `fail@mediplan.app` para forzar un error de API y ver el
 * manejo de errores con Sonner.
 */

const SESSION_STORAGE_KEY = 'mediplan-auth';
const API_LATENCY_MS = 900;

const DEMO_FAILURE_EMAIL = 'fail@mediplan.app';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function assertNotDemoFailure(email: string): void {
  if (email.trim().toLowerCase() === DEMO_FAILURE_EMAIL) {
    throw new Error('No pudimos iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.');
  }
}

function buildUserFromLogin(payload: LoginPayload): User {
  const fallbackName = payload.email.split('@')[0] ?? 'profesional';

  return {
    id: crypto.randomUUID(),
    name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
    email: payload.email,
    professionalType: 'other',
    createdAt: new Date().toISOString(),
  };
}

function persistSession(response: AuthResponse): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
}

/** Recupera la sesión persistida (si existe). */
export function loadSession(): AuthResponse | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

/** Elimina la sesión persistida. */
export function clearSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

/** Simula el login contra la API. */
export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  await delay(API_LATENCY_MS);
  assertNotDemoFailure(payload.email);

  const response: AuthResponse = {
    token: `demo-token-${crypto.randomUUID()}`,
    user: buildUserFromLogin(payload),
  };

  persistSession(response);
  return response;
}

/** Simula el registro de una nueva cuenta. */
export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  await delay(API_LATENCY_MS);
  assertNotDemoFailure(payload.email);

  const response: AuthResponse = {
    token: `demo-token-${crypto.randomUUID()}`,
    user: {
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      professionalType: payload.professionalType,
      clinicName: payload.clinicName,
      createdAt: new Date().toISOString(),
    },
  };

  persistSession(response);
  return response;
}
