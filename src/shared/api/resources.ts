import { apiRequest, type QueryValue, type RequestOptions } from '@/shared/api/http';
import type { ItemResponse, MessageResponse, PaginatedResponse } from '@/types';

/** Petición que devuelve `{ message, data }` y extrae `data`. */
export async function fetchItem<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await apiRequest<ItemResponse<T>>(path, options);
  return response.data;
}

/** Petición que devuelve `{ message, data, meta }` (listas paginadas). */
export function fetchList<T>(path: string, options?: RequestOptions): Promise<PaginatedResponse<T>> {
  return apiRequest<PaginatedResponse<T>>(path, options);
}

/** Petición que devuelve solo `{ message }` (borrados, logout…). */
export function fetchMessage(path: string, options?: RequestOptions): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(path, options);
}

/** Convierte un objeto de filtros del formulario en query string, omitiendo vacíos. */
export function cleanQuery<T extends object>(query: T): Record<string, QueryValue> {
  const result: Record<string, QueryValue> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    result[key] = value as QueryValue;
  }
  return result;
}

/** Elimina claves con `undefined` o cadenas vacías; útil para bodies JSON opcionales. */
export function compactPayload<T extends object>(payload: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(payload) as Array<keyof T>) {
    if (payload[key] !== undefined) result[key] = payload[key];
  }
  return result;
}
