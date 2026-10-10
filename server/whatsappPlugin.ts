import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

import type { Plugin } from 'vite';

/**
 * API local de MediPlan para WhatsApp Cloud API.
 *
 * El navegador no debe guardar el App Secret ni verificar webhooks. Este
 * plugin —activo en `vite dev` y `vite preview`— habla con Graph API cuando
 * el servidor tiene salida a Meta, guarda el token fuera del bundle y
 * responde el handshake de webhooks que exige Meta.
 */

const DATA_DIR = path.resolve(process.cwd(), 'data');
const APP_FILE = path.join(DATA_DIR, 'meta-app.json');
const CONNECTIONS_FILE = path.join(DATA_DIR, 'whatsapp-connections.json');
const EVENTS_FILE = path.join(DATA_DIR, 'whatsapp-events.json');

const DEFAULT_GRAPH_VERSION = 'v26.0';
const MAX_BODY_BYTES = 1_000_000;
const MAX_EVENTS = 40;
const GRAPH_TIMEOUT_MS = 20_000;

interface MetaAppConfig {
  appId: string;
  appSecret: string;
  configId: string;
  solutionId: string;
  graphVersion: string;
  webhookVerifyToken: string;
}

interface StoredConnection {
  clinicId: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string | null;
  updatedAt: string;
  snapshot: Record<string, unknown>;
}

interface WebhookEventRecord {
  id: string;
  receivedAt: string;
  signatureVerified: boolean;
  wabaId?: string;
  field?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  summary: string;
  preview: string;
}

interface StoreShape<T> {
  items: T;
}

type NextFunction = (error?: unknown) => void;

let writeChain: Promise<void> = Promise.resolve();
let reachabilityCache: { at: number; ok: boolean; detail: string } | null = null;

function emptyAppConfig(env: Record<string, string>): MetaAppConfig {
  return {
    appId: env.META_APP_ID?.trim() ?? '',
    appSecret: env.META_APP_SECRET?.trim() ?? '',
    configId: env.META_CONFIG_ID?.trim() ?? '',
    solutionId: env.META_SOLUTION_ID?.trim() ?? '',
    graphVersion: env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION,
    webhookVerifyToken: env.META_WEBHOOK_VERIFY_TOKEN?.trim() ?? '',
  };
}

function isGraphVersion(value: string): boolean {
  return /^v\d+\.\d+$/.test(value);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}

function sendText(res: ServerResponse, status: number, body: string, contentType = 'text/plain; charset=utf-8'): void {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('El cuerpo de la petición supera el límite de 1 MB.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

function clinicIdFrom(req: IncomingMessage): string | null {
  const raw = req.headers['x-clinic-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) return null;
  return value;
}

async function loadAppConfig(env: Record<string, string>): Promise<MetaAppConfig> {
  const fromEnv = emptyAppConfig(env);
  const stored = await readJson<Partial<MetaAppConfig>>(APP_FILE, {});
  const graphVersion = isGraphVersion(fromEnv.graphVersion)
    ? fromEnv.graphVersion
    : isGraphVersion(stored.graphVersion ?? '')
      ? (stored.graphVersion as string)
      : DEFAULT_GRAPH_VERSION;

  const config: MetaAppConfig = {
    appId: fromEnv.appId || stored.appId || '',
    appSecret: fromEnv.appSecret || stored.appSecret || '',
    configId: fromEnv.configId || stored.configId || '',
    solutionId: fromEnv.solutionId || stored.solutionId || '',
    graphVersion,
    webhookVerifyToken: fromEnv.webhookVerifyToken || stored.webhookVerifyToken || '',
  };

  if (!config.webhookVerifyToken) {
    config.webhookVerifyToken = randomBytes(24).toString('hex');
    await enqueueWrite(() => writeJson(APP_FILE, config));
  }

  return config;
}

async function canReachMeta(version: string): Promise<{ ok: boolean; detail: string }> {
  const now = Date.now();
  if (reachabilityCache && now - reachabilityCache.at < 5 * 60 * 1000) {
    return reachabilityCache;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, 1800);

  try {
    const response = await fetch(`https://graph.facebook.com/${version}/`, {
      signal: controller.signal,
      redirect: 'manual',
    });
    const result = {
      at: now,
      ok: response.status > 0,
      detail: `HTTP ${response.status}`,
    };
    reachabilityCache = result;
    return result;
  } catch (error) {
    const result = {
      at: now,
      ok: false,
      detail: error instanceof Error ? error.message : 'sin conexión',
    };
    reachabilityCache = result;
    return result;
  } finally {
    clearTimeout(timer);
  }
}

function publicAppConfig(config: MetaAppConfig, reachability: { ok: boolean; detail: string }) {
  return {
    graphVersion: config.graphVersion,
    serverCanReachMeta: reachability.ok,
    serverProbe: reachability.detail,
    appId: config.appId || null,
    configId: config.configId || null,
    solutionId: config.solutionId || null,
    hasAppSecret: Boolean(config.appSecret),
    webhookVerifyToken: config.webhookVerifyToken,
    webhookPath: '/api/whatsapp/webhook',
  };
}

function isSafeGraphPath(value: string): boolean {
  return /^[A-Za-z0-9_./-]{1,240}$/.test(value) && !value.includes('..') && !value.startsWith('/');
}

function verifyHubSignature(raw: string, header: string | undefined, secret: string): boolean {
  if (!secret || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const received = header.slice('sha256='.length);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function summarizeWebhook(payload: unknown): Omit<WebhookEventRecord, 'id' | 'receivedAt' | 'signatureVerified'> {
  const root = asRecord(payload);
  const entry = asRecord(Array.isArray(root?.entry) ? root.entry[0] : null);
  const change = asRecord(Array.isArray(entry?.changes) ? entry.changes[0] : null);
  const value = asRecord(change?.value);
  const metadata = asRecord(value?.metadata);
  const field = typeof change?.field === 'string' ? change.field : undefined;
  const phoneNumberId = typeof metadata?.phone_number_id === 'string' ? metadata.phone_number_id : undefined;
  const displayPhoneNumber =
    typeof metadata?.display_phone_number === 'string' ? metadata.display_phone_number : undefined;
  const wabaId = typeof entry?.id === 'string' ? entry.id : undefined;

  let summary = 'Evento de WhatsApp recibido.';

  if (field === 'messages') {
    const messages = Array.isArray(value?.messages) ? value.messages : [];
    const statuses = Array.isArray(value?.statuses) ? value.statuses : [];
    if (messages.length > 0) {
      const first = asRecord(messages[0]);
      const text = asRecord(first?.text);
      const from = typeof first?.from === 'string' ? first.from : 'un paciente';
      const body = typeof text?.body === 'string' ? text.body.slice(0, 80) : first?.type;
      summary = `Mensaje entrante de ${from}${body ? `: ${String(body)}` : ''}`;
    } else if (statuses.length > 0) {
      const first = asRecord(statuses[0]);
      const status = typeof first?.status === 'string' ? first.status : 'actualizado';
      const recipient = typeof first?.recipient_id === 'string' ? first.recipient_id : '';
      summary = `Estado de entrega: ${status}${recipient ? ` · ${recipient}` : ''}`;
    }
  } else if (field === 'message_template_status_update') {
    const name = typeof value?.message_template_name === 'string' ? value.message_template_name : 'plantilla';
    const event = typeof value?.event === 'string' ? value.event : 'actualizada';
    summary = `Plantilla ${name}: ${event}`;
  } else if (field === 'phone_number_quality_update') {
    summary = 'Meta actualizó la calidad del número de WhatsApp.';
  } else if (field === 'account_update') {
    summary = 'Meta actualizó la cuenta de WhatsApp Business.';
  } else if (field === 'history') {
    summary = 'Llegó un fragmento del historial de la app WhatsApp Business.';
  } else if (field === 'smb_app_state_sync') {
    summary = 'Llegó una sincronización de contactos de la app WhatsApp Business.';
  } else if (field === 'smb_message_echoes') {
    summary = 'Eco de un mensaje enviado desde la app WhatsApp Business.';
  } else if (field) {
    summary = `Webhook ${field} recibido.`;
  }

  const preview = JSON.stringify(payload).slice(0, 1500);

  return { wabaId, field, phoneNumberId, displayPhoneNumber, summary, preview };
}

async function appendEvent(event: WebhookEventRecord): Promise<void> {
  await enqueueWrite(async () => {
    const current = await readJson<StoreShape<WebhookEventRecord[]>>(EVENTS_FILE, { items: [] });
    current.items = [event, ...current.items].slice(0, MAX_EVENTS);
    await writeJson(EVENTS_FILE, current);
  });
}

async function proxyGraph(
  config: MetaAppConfig,
  clinicId: string | null,
  body: {
    method?: string;
    path?: string;
    query?: Record<string, string>;
    body?: unknown;
    accessToken?: string;
    useStoredToken?: boolean;
  },
): Promise<{ status: number; payload: unknown }> {
  const method = (body.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'POST' && method !== 'DELETE') {
    return { status: 400, payload: { error: { message: 'Método no permitido.' } } };
  }
  if (!body.path || !isSafeGraphPath(body.path)) {
    return { status: 400, payload: { error: { message: 'Ruta de Graph API no válida.' } } };
  }

  let token = body.accessToken?.trim() ?? '';
  if (body.useStoredToken) {
    if (!clinicId) {
      return { status: 400, payload: { error: { message: 'Falta el identificador de la clínica.' } } };
    }
    const store = await readJson<StoreShape<Record<string, StoredConnection>>>(CONNECTIONS_FILE, { items: {} });
    token = store.items[clinicId]?.accessToken ?? '';
    if (!token) {
      return {
        status: 401,
        payload: { error: { message: 'No hay un token guardado en el servidor para esta clínica.' } },
      };
    }
  }

  if (!token) {
    return { status: 400, payload: { error: { message: 'Falta el token de acceso de Meta.' } } };
  }

  const reachability = await canReachMeta(config.graphVersion);
  if (!reachability.ok) {
    return {
      status: 503,
      payload: {
        error: {
          message: 'Este servidor no puede llegar a graph.facebook.com. MediPlan usará el navegador.',
          code: 'upstream_unreachable',
        },
      },
    };
  }

  const url = new URL(`https://graph.facebook.com/${config.graphVersion}/${body.path}`);
  for (const [key, value] of Object.entries(body.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  }
  // No añadimos appsecret_proof con el secreto global: el token de una clínica
  // suele pertenecer a su propia app, y un proof de otra app hace fallar Graph.

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, GRAPH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      redirect: 'error',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method === 'GET' || body.body === undefined ? undefined : JSON.stringify(body.body),
    });
    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = { error: { message: text.slice(0, 500) } };
      }
    }
    return { status: response.status, payload };
  } catch (error) {
    return {
      status: 502,
      payload: {
        error: {
          message: error instanceof Error ? error.message : 'Fallo al llamar a Meta.',
          code: 'upstream_unreachable',
        },
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function handleWhatsAppApi(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const { pathname } = url;
  const method = req.method ?? 'GET';

  if (pathname === '/api/whatsapp/webhook' && method === 'GET') {
    const config = await loadAppConfig(env);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token && token === config.webhookVerifyToken && challenge) {
      sendText(res, 200, challenge);
      return;
    }

    sendText(res, 403, 'Token de verificación incorrecto.');
    return;
  }

  if (pathname === '/api/whatsapp/webhook' && method === 'POST') {
    const config = await loadAppConfig(env);
    const raw = await readBody(req);
    const signature = req.headers['x-hub-signature-256'];
    const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
    const signatureVerified = config.appSecret
      ? verifyHubSignature(raw, signatureHeader, config.appSecret)
      : false;

    let payload: unknown = {};
    try {
      payload = raw ? (JSON.parse(raw) as unknown) : {};
    } catch {
      payload = { raw: raw.slice(0, 500) };
    }

    const summary = summarizeWebhook(payload);
    await appendEvent({
      id: randomBytes(8).toString('hex'),
      receivedAt: new Date().toISOString(),
      signatureVerified,
      ...summary,
    });
    sendJson(res, 200, { success: true });
    return;
  }

  if (pathname === '/api/whatsapp/capabilities' && method === 'GET') {
    const config = await loadAppConfig(env);
    const reachability = await canReachMeta(config.graphVersion);
    sendJson(res, 200, publicAppConfig(config, reachability));
    return;
  }

  if (pathname === '/api/whatsapp/events' && method === 'GET') {
    const store = await readJson<StoreShape<WebhookEventRecord[]>>(EVENTS_FILE, { items: [] });
    sendJson(res, 200, { events: store.items });
    return;
  }

  if (pathname === '/api/whatsapp/app-config' && method === 'POST') {
    const envConfig = emptyAppConfig(env);
    const current = await loadAppConfig(env);
    const raw = await readBody(req);
    const body = raw ? (JSON.parse(raw) as Partial<MetaAppConfig>) : {};
    const next: MetaAppConfig = {
      appId: envConfig.appId || body.appId?.trim() || current.appId,
      appSecret: envConfig.appSecret || body.appSecret?.trim() || current.appSecret,
      configId: envConfig.configId || body.configId?.trim() || current.configId,
      solutionId: envConfig.solutionId || body.solutionId?.trim() || current.solutionId,
      graphVersion: current.graphVersion,
      webhookVerifyToken: current.webhookVerifyToken,
    };
    if (body.graphVersion && isGraphVersion(body.graphVersion) && !envConfig.graphVersion) {
      next.graphVersion = body.graphVersion;
    }
    await enqueueWrite(() => writeJson(APP_FILE, next));
    reachabilityCache = null;
    const reachability = await canReachMeta(next.graphVersion);
    sendJson(res, 200, publicAppConfig(next, reachability));
    return;
  }

  if (pathname === '/api/whatsapp/connection' && method === 'GET') {
    const clinicId = clinicIdFrom(req);
    if (!clinicId) {
      sendJson(res, 400, { error: 'Identificador de clínica no válido.' });
      return;
    }
    const store = await readJson<StoreShape<Record<string, StoredConnection>>>(CONNECTIONS_FILE, { items: {} });
    const connection = store.items[clinicId];
    sendJson(res, 200, {
      connection: connection
        ? {
            ...connection.snapshot,
            tokenStorage: 'server',
            hasToken: true,
          }
        : null,
    });
    return;
  }

  if (pathname === '/api/whatsapp/connection' && method === 'PUT') {
    const clinicId = clinicIdFrom(req);
    if (!clinicId) {
      sendJson(res, 400, { error: 'Identificador de clínica no válido.' });
      return;
    }
    const raw = await readBody(req);
    const body = JSON.parse(raw) as {
      accessToken?: string;
      phoneNumberId?: string;
      wabaId?: string | null;
      snapshot?: Record<string, unknown>;
    };
    if (!body.accessToken || !body.phoneNumberId || !body.snapshot) {
      sendJson(res, 400, { error: 'Faltan el token, el número o la ficha de sincronización.' });
      return;
    }
    const record: StoredConnection = {
      clinicId,
      accessToken: body.accessToken,
      phoneNumberId: body.phoneNumberId,
      wabaId: body.wabaId ?? null,
      updatedAt: new Date().toISOString(),
      snapshot: body.snapshot,
    };
    await enqueueWrite(async () => {
      const store = await readJson<StoreShape<Record<string, StoredConnection>>>(CONNECTIONS_FILE, { items: {} });
      store.items[clinicId] = record;
      await writeJson(CONNECTIONS_FILE, store);
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/whatsapp/connection' && method === 'DELETE') {
    const clinicId = clinicIdFrom(req);
    if (!clinicId) {
      sendJson(res, 400, { error: 'Identificador de clínica no válido.' });
      return;
    }
    await enqueueWrite(async () => {
      const store = await readJson<StoreShape<Record<string, StoredConnection>>>(CONNECTIONS_FILE, { items: {} });
      delete store.items[clinicId];
      await writeJson(CONNECTIONS_FILE, store);
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/whatsapp/exchange' && method === 'POST') {
    const config = await loadAppConfig(env);
    if (!config.appId || !config.appSecret) {
      sendJson(res, 400, {
        error: { message: 'Falta el App ID o el App Secret en el servidor. Configúralos antes de usar Embedded Signup.' },
      });
      return;
    }
    const reachability = await canReachMeta(config.graphVersion);
    if (!reachability.ok) {
      sendJson(res, 503, {
        error: {
          message: 'El servidor no puede canjear el código con Meta. Se intentará desde el navegador.',
          code: 'upstream_unreachable',
        },
      });
      return;
    }
    const raw = await readBody(req);
    const body = raw ? (JSON.parse(raw) as { code?: string }) : {};
    if (!body.code) {
      sendJson(res, 400, { error: { message: 'Falta el código de Embedded Signup.' } });
      return;
    }
    const url = new URL(`https://graph.facebook.com/${config.graphVersion}/oauth/access_token`);
    url.searchParams.set('client_id', config.appId);
    url.searchParams.set('client_secret', config.appSecret);
    url.searchParams.set('code', body.code);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, GRAPH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        redirect: 'error',
      });
      const text = await response.text();
      let payload: unknown = {};
      try {
        payload = text ? (JSON.parse(text) as unknown) : {};
      } catch {
        payload = { error: { message: text.slice(0, 300) } };
      }
      sendJson(res, response.status, payload);
    } catch (error) {
      sendJson(res, 502, {
        error: {
          message: error instanceof Error ? error.message : 'No se pudo canjear el código.',
          code: 'upstream_unreachable',
        },
      });
    } finally {
      clearTimeout(timer);
    }
    return;
  }

  if (pathname === '/api/whatsapp/graph' && method === 'POST') {
    const config = await loadAppConfig(env);
    const clinicId = clinicIdFrom(req);
    const raw = await readBody(req);
    const body = raw
      ? (JSON.parse(raw) as {
          method?: string;
          path?: string;
          query?: Record<string, string>;
          body?: unknown;
          accessToken?: string;
          useStoredToken?: boolean;
        })
      : {};
    const result = await proxyGraph(config, clinicId, body);
    sendJson(res, result.status, result.payload);
    return;
  }

  sendJson(res, 404, { error: 'Ruta no encontrada.' });
}

export function whatsappApiPlugin(env: Record<string, string>): Plugin {
  const middleware = (req: IncomingMessage, res: ServerResponse, next: NextFunction): void => {
    const url = req.url ?? '';
    const pathOnly = url.split('?')[0] ?? '';
    if (!pathOnly.startsWith('/api/whatsapp')) {
      next();
      return;
    }

    void handleWhatsAppApi(req, res, env).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Error interno.';
      if (!res.headersSent) {
        sendJson(res, 500, { error: message });
      }
    });
  };

  return {
    name: 'mediplan-whatsapp-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
