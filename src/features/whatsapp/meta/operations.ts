import { NOTICE_CATALOG } from '@/features/whatsapp/catalog';
import { isMetaApiError } from '@/features/whatsapp/meta/errors';
import type { GraphCaller } from '@/features/whatsapp/meta/graph';
import type {
  BusinessProfileSnapshot,
  MetaTemplate,
  PublicConnection,
  SendResult,
} from '@/features/whatsapp/types';

const PHONE_FIELDS = [
  'id',
  'display_phone_number',
  'verified_name',
  'quality_rating',
  'code_verification_status',
  'platform_type',
  'name_status',
  'status',
  'messaging_limit_tier',
  'is_official_business_account',
  'is_on_biz_app',
  'account_mode',
  'throughput',
].join(',');

const PHONE_FIELDS_SAFE = 'id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,name_status,status';

const WABA_FIELDS = 'id,name,currency,timezone_id,account_review_status,business_verification_status,ownership_type,message_template_namespace';

export interface MetaPhoneNode {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;
  platform_type?: string;
  name_status?: string;
  status?: string;
  messaging_limit_tier?: string;
  is_official_business_account?: boolean;
  is_on_biz_app?: boolean;
  account_mode?: string;
  throughput?: { level?: string };
}

export interface MetaWabaNode {
  id: string;
  name?: string;
  currency?: string;
  timezone_id?: string;
  account_review_status?: string;
  business_verification_status?: string;
  ownership_type?: string;
  message_template_namespace?: string;
}

interface DebugTokenResponse {
  data?: {
    app_id?: string;
    is_valid?: boolean;
    expires_at?: number;
    scopes?: string[];
    granular_scopes?: Array<{ scope?: string; target_ids?: string[] }>;
  };
}

interface ListResponse<T> {
  data?: T[];
  paging?: { cursors?: { after?: string }; next?: string };
}

export interface Inspection {
  phone: MetaPhoneNode;
  waba: MetaWabaNode | null;
  tokenExpiresAt: number | null;
  tokenIsValid: boolean | null;
  scopes: string[];
  warnings: string[];
  profile: BusinessProfileSnapshot | null;
}

export interface ConnectInput {
  accessToken?: string;
  phoneNumberId: string;
  wabaId?: string;
  appId?: string;
  appSecret?: string;
}

function warningFrom(error: unknown): string {
  return isMetaApiError(error) ? error.message : 'No se pudo completar un paso opcional con Meta.';
}

async function getPhone(caller: GraphCaller, phoneNumberId: string): Promise<MetaPhoneNode> {
  try {
    return await caller.request<MetaPhoneNode>({
      path: phoneNumberId,
      query: { fields: PHONE_FIELDS },
    });
  } catch (error) {
    if (isMetaApiError(error) && (error.code === 100 || error.status === 400)) {
      return caller.request<MetaPhoneNode>({
        path: phoneNumberId,
        query: { fields: PHONE_FIELDS_SAFE },
      });
    }
    throw error;
  }
}

async function getWaba(caller: GraphCaller, wabaId: string): Promise<MetaWabaNode> {
  try {
    return await caller.request<MetaWabaNode>({
      path: wabaId,
      query: { fields: WABA_FIELDS },
    });
  } catch (error) {
    if (isMetaApiError(error) && (error.code === 100 || error.status === 400)) {
      return caller.request<MetaWabaNode>({ path: wabaId, query: { fields: 'id,name' } });
    }
    throw error;
  }
}

async function listPhoneIds(caller: GraphCaller, wabaId: string): Promise<string[]> {
  const response = await caller.request<ListResponse<{ id: string }>>({
    path: `${wabaId}/phone_numbers`,
    query: { fields: 'id', limit: 50 },
  });
  return (response.data ?? []).map((item) => item.id);
}

export async function listTemplates(caller: GraphCaller, wabaId: string): Promise<MetaTemplate[]> {
  const templates: MetaTemplate[] = [];
  let after: string | undefined;

  for (let page = 0; page < 4; page += 1) {
    const response = await caller.request<ListResponse<MetaTemplate>>({
      path: `${wabaId}/message_templates`,
      query: {
        fields: 'id,name,status,language,category,rejected_reason,components',
        limit: 50,
        after,
      },
    });
    templates.push(...(response.data ?? []));
    after = response.paging?.cursors?.after;
    if (!response.paging?.next || !after) break;
  }

  return templates;
}

async function debugToken(
  caller: GraphCaller,
  token: string,
  appId?: string,
  appSecret?: string,
): Promise<DebugTokenResponse['data'] | null> {
  const query: Record<string, string> = { input_token: token };
  if (appId && appSecret) {
    query.access_token = `${appId}|${appSecret}`;
  } else {
    query.access_token = token;
  }

  try {
    const response = await caller.request<DebugTokenResponse>({ path: 'debug_token', query });
    return response.data ?? null;
  } catch {
    return null;
  }
}

function wabaIdsFromDebug(data: DebugTokenResponse['data'] | null): string[] {
  const ids = new Set<string>();
  if (!data) return [];
  for (const scope of data?.granular_scopes ?? []) {
    if (scope.scope !== 'whatsapp_business_management' && scope.scope !== 'whatsapp_business_messaging') {
      continue;
    }
    for (const id of scope.target_ids ?? []) ids.add(id);
  }
  return [...ids];
}

async function discoverWabaId(caller: GraphCaller, phoneNumberId: string, hinted?: string[]): Promise<string | null> {
  const candidates = [...(hinted ?? [])];

  try {
    const me = await caller.request<{ id?: string }>({ path: 'me', query: { fields: 'id' } });
    if (me.id) {
      const assigned = await caller.request<ListResponse<{ id: string }>>({
        path: `${me.id}/assigned_whatsapp_business_accounts`,
        query: { fields: 'id', limit: 20 },
      });
      for (const item of assigned.data ?? []) candidates.push(item.id);
    }
  } catch {
    // Un token de usuario del sistema a veces no expone /me. Seguimos con debug_token.
  }

  const unique = [...new Set(candidates)];
  for (const wabaId of unique) {
    try {
      const phones = await listPhoneIds(caller, wabaId);
      if (phones.includes(phoneNumberId)) return wabaId;
    } catch {
      continue;
    }
  }

  return unique.length === 1 ? unique[0] : null;
}

export async function getBusinessProfile(caller: GraphCaller, phoneNumberId: string): Promise<BusinessProfileSnapshot | null> {
  try {
    const response = await caller.request<ListResponse<Record<string, unknown>>>({
      path: `${phoneNumberId}/whatsapp_business_profile`,
      query: { fields: 'about,address,description,email,profile_picture_url,websites,vertical' },
    });
    const profile = response.data?.[0];
    if (!profile) return null;
    const websites = Array.isArray(profile.websites) ? profile.websites.filter((item) => typeof item === 'string') : [];
    return {
      about: typeof profile.about === 'string' ? profile.about : '',
      address: typeof profile.address === 'string' ? profile.address : '',
      description: typeof profile.description === 'string' ? profile.description : '',
      email: typeof profile.email === 'string' ? profile.email : '',
      websites: websites as string[],
      vertical: typeof profile.vertical === 'string' ? profile.vertical : 'HEALTH',
      profilePictureUrl: typeof profile.profile_picture_url === 'string' ? profile.profile_picture_url : null,
    };
  } catch {
    return null;
  }
}

export async function inspectAccount(
  caller: GraphCaller,
  input: ConnectInput,
  onProgress?: (message: string) => void,
): Promise<Inspection> {
  const warnings: string[] = [];
  onProgress?.('Verificando el número en Graph API…');
  const phone = await getPhone(caller, input.phoneNumberId);
  if (!phone.id) {
    throw new Error('Meta respondió sin el identificador del número. Revisa el Phone number ID.');
  }

  onProgress?.('Comprobando el token…');
  const tokenInfo = input.accessToken
    ? await debugToken(caller, input.accessToken, input.appId, input.appSecret)
    : null;
  if (tokenInfo && tokenInfo.is_valid === false) {
    warnings.push('debug_token marcó el token como no válido. Si el número sí se leyó, puede ser un límite del diagnóstico y no de envío.');
  }

  onProgress?.('Buscando la cuenta de WhatsApp Business…');
  let wabaId = input.wabaId?.trim() || null;
  if (!wabaId) {
    wabaId = await discoverWabaId(caller, phone.id, wabaIdsFromDebug(tokenInfo));
    if (!wabaId) {
      warnings.push('No pudimos descubrir el WABA ID. Pégalo desde API Setup para crear plantillas y activar webhooks.');
    }
  }

  let waba: MetaWabaNode | null = null;
  if (wabaId) {
    try {
      waba = await getWaba(caller, wabaId);
      const phones = await listPhoneIds(caller, wabaId);
      if (phones.length > 0 && !phones.includes(phone.id)) {
        warnings.push('Ese WABA ID no incluye este Phone number ID. Confirma que ambos salgan de la misma pantalla de API Setup.');
      }
    } catch (error) {
      warnings.push(warningFrom(error));
      waba = { id: wabaId };
    }
  }

  onProgress?.('Leyendo el perfil de negocio…');
  const profile = await getBusinessProfile(caller, phone.id);

  return {
    phone,
    waba,
    tokenExpiresAt: tokenInfo?.expires_at ?? null,
    tokenIsValid: tokenInfo?.is_valid ?? null,
    scopes: tokenInfo?.scopes ?? [],
    warnings,
    profile,
  };
}

export function inspectionToSnapshot(
  inspection: Inspection,
  base: Pick<PublicConnection, 'clinicId' | 'tokenStorage' | 'tokenPreview' | 'method' | 'graphVersion' | 'notices' | 'appId' | 'businessId'> & {
    connectedAt?: string;
  },
): PublicConnection {
  const now = new Date().toISOString();
  return {
    clinicId: base.clinicId,
    tokenStorage: base.tokenStorage,
    tokenPreview: base.tokenPreview,
    method: base.method,
    graphVersion: base.graphVersion,
    connectedAt: base.connectedAt ?? now,
    updatedAt: now,
    lastCheckedAt: now,
    phoneNumberId: inspection.phone.id,
    wabaId: inspection.waba?.id ?? null,
    businessId: base.businessId,
    displayPhoneNumber: inspection.phone.display_phone_number ?? null,
    verifiedName: inspection.phone.verified_name ?? null,
    qualityRating: inspection.phone.quality_rating ?? null,
    codeVerificationStatus: inspection.phone.code_verification_status ?? null,
    platformType: inspection.phone.platform_type ?? null,
    nameStatus: inspection.phone.name_status ?? null,
    status: inspection.phone.status ?? null,
    messagingLimitTier: inspection.phone.messaging_limit_tier ?? null,
    isOfficialBusinessAccount: inspection.phone.is_official_business_account ?? null,
    isOnBizApp: inspection.phone.is_on_biz_app ?? null,
    accountMode: inspection.phone.account_mode ?? null,
    throughputLevel: inspection.phone.throughput?.level ?? null,
    wabaName: inspection.waba?.name ?? null,
    currency: inspection.waba?.currency ?? null,
    timezoneId: inspection.waba?.timezone_id ?? null,
    accountReviewStatus: inspection.waba?.account_review_status ?? null,
    businessVerificationStatus: inspection.waba?.business_verification_status ?? null,
    ownershipType: inspection.waba?.ownership_type ?? null,
    templateNamespace: inspection.waba?.message_template_namespace ?? null,
    tokenExpiresAt: inspection.tokenExpiresAt,
    tokenIsValid: inspection.tokenIsValid,
    scopes: inspection.scopes,
    warnings: inspection.warnings,
    notices: base.notices,
    appId: base.appId,
    profile: inspection.profile,
  };
}

export async function createRecommendedTemplates(
  caller: GraphCaller,
  wabaId: string,
  language: string,
  onProgress?: (message: string) => void,
): Promise<Array<{ name: string; ok: boolean; detail: string }>> {
  const results: Array<{ name: string; ok: boolean; detail: string }> = [];

  for (const notice of NOTICE_CATALOG) {
    onProgress?.(`Creando plantilla ${notice.templateName}…`);
    const components: Array<Record<string, unknown>> = [
      {
        type: 'BODY',
        text: notice.body,
        example: { body_text: [notice.examples] },
      },
      { type: 'FOOTER', text: notice.footer },
    ];
    if (notice.buttons?.length) {
      components.push({
        type: 'BUTTONS',
        buttons: notice.buttons.map((text) => ({ type: 'QUICK_REPLY', text })),
      });
    }

    try {
      await caller.request({
        method: 'POST',
        path: `${wabaId}/message_templates`,
        body: {
          name: notice.templateName,
          language,
          category: notice.category,
          components,
        },
      });
      results.push({ name: notice.templateName, ok: true, detail: 'Enviada a revisión de Meta.' });
    } catch (error) {
      const message = isMetaApiError(error) ? error.message : 'No se pudo crear.';
      const already = isMetaApiError(error) && (error.subcode === 2388024 || /ya existe|already exists/i.test(error.originalMessage));
      results.push({
        name: notice.templateName,
        ok: already,
        detail: already ? 'Ya existía en esta cuenta.' : message,
      });
    }
  }

  return results;
}

export async function sendTemplateMessage(
  caller: GraphCaller,
  input: {
    phoneNumberId: string;
    to: string;
    templateName: string;
    language: string;
    variables: string[];
  },
): Promise<string> {
  const response = await caller.request<{ messages?: Array<{ id?: string }> }>({
    method: 'POST',
    path: `${input.phoneNumberId}/messages`,
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.language },
        ...(input.variables.length > 0
          ? {
              components: [
                {
                  type: 'body',
                  parameters: input.variables.map((text) => ({
                    type: 'text',
                    text: text.replace(/[\n\r\t]+/g, ' ').replace(/ {5,}/g, '    ').trim(),
                  })),
                },
              ],
            }
          : {}),
      },
    },
  });
  const messageId = response.messages?.[0]?.id;
  if (!messageId) {
    throw new Error('Meta aceptó la petición pero no devolvió un id de mensaje.');
  }
  return messageId;
}

export async function sendTextMessage(
  caller: GraphCaller,
  input: { phoneNumberId: string; to: string; body: string },
): Promise<string> {
  const response = await caller.request<{ messages?: Array<{ id?: string }> }>({
    method: 'POST',
    path: `${input.phoneNumberId}/messages`,
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'text',
      text: { preview_url: false, body: input.body },
    },
  });
  const messageId = response.messages?.[0]?.id;
  if (!messageId) {
    throw new Error('Meta aceptó la petición pero no devolvió un id de mensaje.');
  }
  return messageId;
}

export async function sendMany(
  recipients: string[],
  sendOne: (to: string) => Promise<string>,
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  for (const to of recipients) {
    try {
      const messageId = await sendOne(to);
      results.push({ to, ok: true, messageId });
    } catch (error) {
      results.push({
        to,
        ok: false,
        error: isMetaApiError(error) ? error.message : error instanceof Error ? error.message : 'Error al enviar.',
      });
    }
    if (recipients.length > 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 250);
      });
    }
  }
  return results;
}

export async function updateBusinessProfile(
  caller: GraphCaller,
  phoneNumberId: string,
  profile: Omit<BusinessProfileSnapshot, 'profilePictureUrl'>,
): Promise<void> {
  await caller.request({
    method: 'POST',
    path: `${phoneNumberId}/whatsapp_business_profile`,
    body: {
      messaging_product: 'whatsapp',
      about: profile.about,
      address: profile.address,
      description: profile.description,
      email: profile.email,
      websites: profile.websites.filter(Boolean).slice(0, 2),
      vertical: profile.vertical,
    },
  });
}

export async function subscribeApp(
  caller: GraphCaller,
  wabaId: string,
  override?: { callbackUrl: string; verifyToken: string },
): Promise<void> {
  await caller.request({
    method: 'POST',
    path: `${wabaId}/subscribed_apps`,
    body: override
      ? {
          override_callback_uri: override.callbackUrl,
          verify_token: override.verifyToken,
        }
      : undefined,
  });
}

export async function registerPhone(caller: GraphCaller, phoneNumberId: string, pin: string): Promise<void> {
  await caller.request({
    method: 'POST',
    path: `${phoneNumberId}/register`,
    body: {
      messaging_product: 'whatsapp',
      pin,
    },
  });
}

export async function startCoexistenceSync(
  caller: GraphCaller,
  phoneNumberId: string,
  syncType: 'smb_app_state_sync' | 'history',
): Promise<string | null> {
  const response = await caller.request<{ request_id?: string }>({
    method: 'POST',
    path: `${phoneNumberId}/smb_app_data`,
    body: {
      messaging_product: 'whatsapp',
      sync_type: syncType,
    },
  });
  return response.request_id ?? null;
}

export function templateStatus(templates: MetaTemplate[], name: string, language: string): MetaTemplate | undefined {
  return templates.find(
    (template) => template.name === name && template.language.toLowerCase() === language.toLowerCase(),
  );
}

export function isApproved(template: MetaTemplate | undefined): boolean {
  return template?.status.toUpperCase() === 'APPROVED';
}
