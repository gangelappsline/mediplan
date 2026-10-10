import type { EmbeddedSessionInfo } from '@/features/whatsapp/types';

interface FacebookAuthResponse {
  code?: string;
}

interface FacebookLoginResponse {
  authResponse?: FacebookAuthResponse | null;
  status?: string;
}

interface FacebookSDK {
  init(params: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    autoLogAppEvents?: boolean;
    version: string;
  }): void;
  login(
    callback: (response: FacebookLoginResponse) => void,
    options: Record<string, unknown>,
  ): void;
}

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

function isFacebookOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && (url.hostname === 'facebook.com' || url.hostname.endsWith('.facebook.com'));
  } catch {
    return false;
  }
}

function parseSession(data: unknown): EmbeddedSessionInfo | null {
  const record = typeof data === 'string' ? safeJson(data) : data;
  if (!record || typeof record !== 'object') return null;
  const message = record as {
    type?: string;
    event?: string;
    data?: {
      phone_number_id?: string;
      waba_id?: string;
      business_id?: string;
      current_step?: string;
      error_message?: string;
      error_code?: string | number;
    };
  };
  if (message.type !== 'WA_EMBEDDED_SIGNUP') return null;
  return {
    event: message.event ?? '',
    phoneNumberId: message.data?.phone_number_id ?? null,
    wabaId: message.data?.waba_id ?? null,
    businessId: message.data?.business_id ?? null,
    currentStep: message.data?.current_step ?? null,
    errorMessage: message.data?.error_message ?? null,
    errorCode: message.data?.error_code != null ? String(message.data.error_code) : null,
  };
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

let sdkPromise: Promise<void> | null = null;

export function loadFacebookSdk(): Promise<void> {
  if (window.FB) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const previous = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      previous?.();
      resolve();
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) return;

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/es_LA/sdk.js';
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('No se pudo cargar el SDK de Facebook. Revisa que connect.facebook.net no esté bloqueado.'));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}

export function initFacebookSdk(appId: string, version: string): void {
  window.FB?.init({
    appId,
    cookie: true,
    xfbml: true,
    autoLogAppEvents: true,
    version,
  });
}

export interface EmbeddedSignupLaunch {
  configId: string;
  solutionId?: string | null;
  coexistence: boolean;
  onSession: (session: EmbeddedSessionInfo) => void;
  onCode: (code: string, session: EmbeddedSessionInfo | null) => void;
  onCancel: (session: EmbeddedSessionInfo | null) => void;
}

/**
 * Debe llamarse dentro del clic del usuario. Facebook bloquea la ventana
 * si FB.login se dispara después de un await.
 */
export function launchEmbeddedSignup(input: EmbeddedSignupLaunch): () => void {
  if (!window.FB) {
    throw new Error('El SDK de Facebook todavía no está listo.');
  }

  let session: EmbeddedSessionInfo | null = null;
  let settled = false;

  const onMessage = (event: MessageEvent) => {
    if (!isFacebookOrigin(event.origin)) return;
    const parsed = parseSession(event.data);
    if (!parsed) return;
    session = parsed;
    input.onSession(parsed);
  };

  window.addEventListener('message', onMessage);

  const extras: Record<string, unknown> = { setup: {} };
  if (input.solutionId) {
    extras.setup = { solutionID: input.solutionId };
  }
  if (input.coexistence) {
    extras.featureType = 'whatsapp_business_app_onboarding';
    extras.sessionInfoVersion = '3';
  }

  window.FB.login(
    (response) => {
      const code = response.authResponse?.code;
      if (!code) {
        if (!settled) {
          settled = true;
          window.removeEventListener('message', onMessage);
          input.onCancel(session);
        }
        return;
      }

      window.setTimeout(() => {
        if (settled) return;
        settled = true;
        window.removeEventListener('message', onMessage);
        input.onCode(code, session);
      }, 1200);
    },
    {
      config_id: input.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras,
    },
  );

  return () => {
    window.removeEventListener('message', onMessage);
  };
}

export function embeddedSignupAvailable(): boolean {
  return typeof window.FB?.login === 'function';
}
