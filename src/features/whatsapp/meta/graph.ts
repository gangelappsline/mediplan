import { isMetaApiError, metaErrorFromPayload, networkMetaError } from '@/features/whatsapp/meta/errors';

export interface GraphRequest {
  method?: 'GET' | 'POST' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

export interface GraphCaller {
  version: string;
  mode: 'browser' | 'server';
  request<T>(input: GraphRequest): Promise<T>;
}

const GRAPH_TIMEOUT_MS = 20_000;

function queryRecord(query: GraphRequest['query']): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    result[key] = String(value);
  }
  return result;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: { message: text.slice(0, 500) } };
  }
}

function assertOk(status: number, payload: unknown): void {
  if (status >= 200 && status < 300) return;
  throw metaErrorFromPayload(status, payload);
}

async function executeGraph<T>(
  version: string,
  token: string,
  input: GraphRequest,
  proof: string | undefined,
  transport: 'json' | 'simple',
): Promise<T> {
  const method = input.method ?? 'GET';
  const url = new URL(`https://graph.facebook.com/${version}/${input.path.replace(/^\//, '')}`);
  for (const [key, value] of Object.entries(queryRecord(input.query))) {
    url.searchParams.set(key, value);
  }
  if (proof) url.searchParams.set('appsecret_proof', proof);

  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: string | undefined;

  if (transport === 'json') {
    headers.Authorization = `Bearer ${token}`;
    if (method !== 'GET' && input.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(input.body);
    }
  } else {
    url.searchParams.set('access_token', token);
    if (method !== 'GET' && input.body !== undefined) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const params = new URLSearchParams();
      const record = input.body as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (value === undefined || value === null) continue;
        params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
      body = params.toString();
    }
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort();
  }, GRAPH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { method, signal: controller.signal, headers, body });
    const payload = await readPayload(response);
    assertOk(response.status, payload);
    return payload as T;
  } catch (error) {
    if (isMetaApiError(error)) throw error;
    throw networkMetaError(error);
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Primero usa el formato oficial (Bearer + JSON). Si el navegador bloquea esa
 * petición, reintenta como request simple: el token va en la query y el POST,
 * si hace falta, como formulario. Graph API acepta ambos en la mayoría de nodos.
 */
export async function browserGraphRequest<T>(version: string, token: string, input: GraphRequest, proof?: string): Promise<T> {
  try {
    return await executeGraph<T>(version, token, input, proof, 'json');
  } catch (error) {
    if (!isMetaApiError(error) || error.kind !== 'network') throw error;
    return executeGraph<T>(version, token, input, proof, 'simple');
  }
}

export async function createAppSecretProof(accessToken: string, appSecret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(accessToken));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function exchangeCodeForToken(input: {
  version: string;
  appId: string;
  appSecret: string;
  code: string;
}): Promise<{ accessToken: string; expiresIn: number | null }> {
  const url = new URL(`https://graph.facebook.com/${input.version}/oauth/access_token`);
  url.searchParams.set('client_id', input.appId);
  url.searchParams.set('client_secret', input.appSecret);
  url.searchParams.set('code', input.code);

  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort();
  }, GRAPH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const payload = await readPayload(response);
    assertOk(response.status, payload);
    const record = payload as { access_token?: string; expires_in?: number };
    if (!record.access_token) {
      throw metaErrorFromPayload(response.status, {
        error: { message: 'Meta no devolvió un token al canjear el código de Embedded Signup.' },
      });
    }
    return { accessToken: record.access_token, expiresIn: record.expires_in ?? null };
  } catch (error) {
    if (isMetaApiError(error)) throw error;
    throw networkMetaError(error);
  } finally {
    window.clearTimeout(timer);
  }
}
