import { createDefaultNotices } from '@/features/whatsapp/catalog';
import type { NoticeSettings, PublicConnection } from '@/features/whatsapp/types';

const STORAGE_KEY = 'mediplan-whatsapp-connections';
const SECRET_KEY = 'mediplan-meta-app-secret';
const PUBLIC_APP_KEY = 'mediplan-meta-app-public';

interface PersistedConnection extends PublicConnection {
  accessToken?: string;
}

interface StoreShape {
  connections: Record<string, PersistedConnection>;
}

const listeners = new Set<() => void>();
const snapshotCache = new Map<string, { raw: string; value: PublicConnection | null }>();

function emptyStore(): StoreShape {
  return { connections: {} };
}

function readStore(): StoreShape {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as StoreShape;
    return parsed.connections ? parsed : emptyStore();
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreShape): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  snapshotCache.clear();
  for (const listener of listeners) listener();
}

export function subscribeWhatsApp(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readPublicConnection(clinicId: string): PublicConnection | null {
  const store = readStore();
  const connection = store.connections[clinicId];
  if (!connection) {
    const cached = snapshotCache.get(clinicId);
    if (cached?.raw === '') return cached.value;
    snapshotCache.set(clinicId, { raw: '', value: null });
    return null;
  }

  const { accessToken: _token, ...publicConnection } = connection;
  const raw = JSON.stringify(publicConnection);
  const cached = snapshotCache.get(clinicId);
  if (cached?.raw === raw) return cached.value;
  snapshotCache.set(clinicId, { raw, value: publicConnection });
  return publicConnection;
}

export function readAccessToken(clinicId: string): string | null {
  return readStore().connections[clinicId]?.accessToken ?? null;
}

export function saveConnection(connection: PublicConnection, accessToken: string | null): void {
  const store = readStore();
  const previous = store.connections[connection.clinicId];
  const next: PersistedConnection = {
    ...connection,
    notices: connection.notices ?? previous?.notices ?? createDefaultNotices(),
  };
  if (accessToken) {
    next.accessToken = accessToken;
  } else if (connection.tokenStorage === 'browser' && previous?.accessToken) {
    next.accessToken = previous.accessToken;
  }
  store.connections[connection.clinicId] = next;
  writeStore(store);
}

export function updateNotices(clinicId: string, notices: NoticeSettings): void {
  const store = readStore();
  const current = store.connections[clinicId];
  if (!current) return;
  store.connections[clinicId] = { ...current, notices, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function clearConnection(clinicId: string): void {
  const store = readStore();
  delete store.connections[clinicId];
  writeStore(store);
}

export function readSessionAppSecret(): string {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(SECRET_KEY) ?? '';
}

export function saveSessionAppSecret(secret: string): void {
  if (!secret) {
    window.sessionStorage.removeItem(SECRET_KEY);
    return;
  }
  window.sessionStorage.setItem(SECRET_KEY, secret);
}

export interface PublicMetaApp {
  appId: string;
  configId: string;
  solutionId: string;
}

export function readLocalMetaApp(): PublicMetaApp {
  if (typeof window === 'undefined') return { appId: '', configId: '', solutionId: '' };
  try {
    const raw = window.localStorage.getItem(PUBLIC_APP_KEY);
    if (!raw) return { appId: '', configId: '', solutionId: '' };
    const parsed = JSON.parse(raw) as Partial<PublicMetaApp>;
    return {
      appId: parsed.appId ?? '',
      configId: parsed.configId ?? '',
      solutionId: parsed.solutionId ?? '',
    };
  } catch {
    return { appId: '', configId: '', solutionId: '' };
  }
}

export function saveLocalMetaApp(app: PublicMetaApp): void {
  window.localStorage.setItem(PUBLIC_APP_KEY, JSON.stringify(app));
}
