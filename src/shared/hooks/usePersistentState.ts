import { useCallback, useEffect, useState } from 'react';

/**
 * Estado persistido en `localStorage` (preferencias de interfaz: sidebar
 * plegado, vista de listado, etc.). Nunca guarda datos de la API.
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Almacenamiento no disponible: la preferencia vive solo en memoria.
    }
  }, [key, value]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (prev: T) => T)(prev) : next));
  }, []);

  return [value, update];
}
