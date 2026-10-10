import { clearSession, getToken } from '@/shared/api/session';

/**
 * Cliente HTTP de MediPlan.
 *
 * - Base: `VITE_API_BASE_URL` o `/api`. En desarrollo y `vite preview`, `/api`
 *   se reenvía al servidor de MediPlan mediante el proxy de `vite.config.ts`
 *   (sin problemas de CORS).
 * - Cabeceras: `Accept: application/json` y `Authorization: Bearer <token>`
 *   cuando hay sesión.
 * - Errores: se normalizan en `ApiError` con el estatus HTTP, el mensaje en
 *   español de la API y el mapa de errores de validación (`errors`).
 */

export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
).replace(/\/+$/, '');

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** `false` para endpoints públicos (login, registro). Por defecto `true`. */
  auth?: boolean;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;
  /** Mapa campo → mensajes (solo en respuestas 422). */
  readonly errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** Lista plana de mensajes de validación, útil para mostrarlos en un formulario. */
  get validationMessages(): string[] {
    return Object.values(this.errors).flat();
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  422: 'Revisa los datos del formulario.',
  429: 'Demasiadas solicitudes. Inténtalo en unos segundos.',
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const search = params.toString();
  return `${API_BASE_URL}${path}${search ? `?${search}` : ''}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractErrors(payload: unknown): Record<string, string[]> {
  if (!isRecord(payload) || !isRecord(payload.errors)) return {};
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(payload.errors)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((m): m is string => typeof m === 'string');
    }
  }
  return result;
}

/**
 * Ejecuta una petición contra la API y devuelve el JSON tipado.
 * Lanza `ApiError` para cualquier respuesta no exitosa.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = true, signal } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      'No pudimos conectar con el servidor de MediPlan. Revisa tu conexión e inténtalo de nuevo.',
      0,
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const apiMessage = isRecord(payload) && typeof payload.message === 'string' ? payload.message : '';
    const message = apiMessage || DEFAULT_MESSAGES[response.status] || 'Ocurrió un error inesperado.';

    // Un 401 en una petición autenticada significa que el token ya no sirve.
    if (response.status === 401 && auth) {
      clearSession();
    }

    throw new ApiError(message, response.status, extractErrors(payload));
  }

  return payload as T;
}

/** Mensaje legible para cualquier error (ApiError o genérico). */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof ApiError) {
    // En 422 el primer mensaje de validación del servidor es más específico que el genérico.
    const first = error.status === 422 ? error.validationMessages[0] : undefined;
    return first ?? error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
