import { isMetaApiError, metaErrorFromPayload } from '@/features/whatsapp/meta/errors';
import { browserGraphRequest, createAppSecretProof, type GraphCaller, type GraphRequest } from '@/features/whatsapp/meta/graph';
import {
  readAccessToken,
  readSessionAppSecret,
} from '@/features/whatsapp/storage';
import type { MetaCapabilities, PublicConnection, WebhookEvent } from '@/features/whatsapp/types';

const CAPABILITIES_FALLBACK: MetaCapabilities = {
  graphVersion: 'v26.0',
  serverCanReachMeta: false,
  serverProbe: 'sin respuesta del servidor local',
  appId: null,
  configId: null,
  solutionId: null,
  hasAppSecret: false,
  webhookVerifyToken: '',
  webhookPath: '/api/whatsapp/webhook',
};

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

export async function fetchCapabilities(): Promise<MetaCapabilities> {
  try {
    const response = await fetch('/api/whatsapp/capabilities', { headers: { Accept: 'application/json' } });
    if (!response.ok) return CAPABILITIES_FALLBACK;
    return (await response.json()) as MetaCapabilities;
  } catch {
    return CAPABILITIES_FALLBACK;
  }
}

export async function saveAppConfig(input: {
  appId?: string;
  appSecret?: string;
  configId?: string;
  solutionId?: string;
}): Promise<MetaCapabilities> {
  const response = await fetch('/api/whatsapp/app-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw metaErrorFromPayload(response.status, payload);
  }
  return payload as MetaCapabilities;
}

export async function saveServerConnection(clinicId: string, connection: PublicConnection, accessToken: string): Promise<void> {
  const response = await fetch('/api/whatsapp/connection', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Clinic-Id': clinicId,
    },
    body: JSON.stringify({
      accessToken,
      phoneNumberId: connection.phoneNumberId,
      wabaId: connection.wabaId,
      snapshot: connection,
    }),
  });
  if (!response.ok) {
    const payload = await parseJson(response);
    throw metaErrorFromPayload(response.status, payload);
  }
}

export async function deleteServerConnection(clinicId: string): Promise<void> {
  await fetch('/api/whatsapp/connection', {
    method: 'DELETE',
    headers: { 'X-Clinic-Id': clinicId },
  });
}

export async function fetchWebhookEvents(): Promise<WebhookEvent[]> {
  const response = await fetch('/api/whatsapp/events');
  if (!response.ok) return [];
  const payload = (await response.json()) as { events?: WebhookEvent[] };
  return payload.events ?? [];
}

export async function createGraphCaller(input: {
  clinicId: string;
  version: string;
  mode: 'browser' | 'server';
  accessToken?: string;
}): Promise<GraphCaller> {
  const request = async <T,>(call: GraphRequest): Promise<T> => {
    const token = input.accessToken || readAccessToken(input.clinicId) || '';

    if (input.mode === 'server') {
      const response = await fetch('/api/whatsapp/graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Clinic-Id': input.clinicId,
        },
        body: JSON.stringify({
          method: call.method ?? 'GET',
          path: call.path.replace(/^\//, ''),
          query: call.query,
          body: call.body,
          accessToken: input.accessToken,
          useStoredToken: !input.accessToken,
        }),
      });
      const payload = await parseJson(response);
      if (!response.ok) {
        const error = metaErrorFromPayload(response.status, payload);
        if (error.kind === 'upstream' && token) {
          return browserGraphRequest<T>(input.version, token, call);
        }
        throw error;
      }
      return payload as T;
    }

    if (!token) {
      throw new Error('No encontramos el token en este navegador. Vuelve a sincronizar WhatsApp.');
    }

    const secret = readSessionAppSecret();
    let proof: string | undefined;
    if (secret) {
      try {
        proof = await createAppSecretProof(token, secret);
      } catch {
        proof = undefined;
      }
    }

    try {
      return await browserGraphRequest<T>(input.version, token, call, proof);
    } catch (error) {
      if (proof && isMetaApiError(error) && /appsecret|proof/i.test(error.originalMessage)) {
        return browserGraphRequest<T>(input.version, token, call);
      }
      throw error;
    }
  };

  return {
    version: input.version,
    mode: input.mode,
    request,
  };
}
