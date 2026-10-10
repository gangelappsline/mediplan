import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { createGraphCaller, fetchCapabilities, saveAppConfig, saveServerConnection } from '@/features/whatsapp/api';
import { createDefaultNotices } from '@/features/whatsapp/catalog';
import { initFacebookSdk, launchEmbeddedSignup, loadFacebookSdk } from '@/features/whatsapp/meta/facebookSdk';
import { errorText, isMetaApiError, metaErrorFromPayload } from '@/features/whatsapp/meta/errors';
import { exchangeCodeForToken } from '@/features/whatsapp/meta/graph';
import { inspectAccount, inspectionToSnapshot, registerPhone, subscribeApp } from '@/features/whatsapp/meta/operations';
import { maskToken } from '@/features/whatsapp/meta/phone';
import {
  connectSchema,
  embeddedConfigSchema,
  type ConnectValues,
  type EmbeddedConfigValues,
} from '@/features/whatsapp/schemas';
import {
  readLocalMetaApp,
  readSessionAppSecret,
  saveConnection,
  saveLocalMetaApp,
  saveSessionAppSecret,
} from '@/features/whatsapp/storage';
import type { EmbeddedSessionInfo, MetaCapabilities } from '@/features/whatsapp/types';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { cn } from '@/shared/lib/utils';

interface ConnectPanelProps {
  clinicId: string;
  capabilities: MetaCapabilities;
  onConnected: () => void;
  onCancel?: () => void;
}

type Method = 'credentials' | 'embedded';

const OUTCOMES = [
  'Confirmaciones, recordatorios, cancelaciones y reprogramaciones',
  'Avisos de cierre y seguimiento después de la visita',
  'Promociones y descuentos, solo con consentimiento',
];

function FieldHint({ children }: { children: string }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

function MetaErrorDetails({ error }: { error: unknown }) {
  if (!isMetaApiError(error)) return null;
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm">
      <p className="font-medium text-destructive">{error.message}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {error.code ? `Código ${error.code}` : `HTTP ${error.status || '—'}`}
        {error.fbtraceId ? ` · fbtrace_id ${error.fbtraceId}` : ''}
      </p>
      {error.originalMessage && error.originalMessage !== error.message ? (
        <p className="mt-1 text-xs text-muted-foreground">{error.originalMessage}</p>
      ) : null}
    </div>
  );
}

async function exchangeEmbeddedCode(version: string, code: string, appId: string, appSecret: string) {
  try {
    const response = await fetch('/api/whatsapp/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code }),
    });
    const payload = (await response.json()) as { access_token?: string; expires_in?: number };
    if (response.ok && payload.access_token) {
      return { accessToken: payload.access_token, expiresIn: payload.expires_in ?? null };
    }
    const exchangedError = metaErrorFromPayload(response.status, payload);
    const secretMissing = /App ID|App Secret/i.test(exchangedError.originalMessage);
    if (exchangedError.kind !== 'upstream' && !secretMissing) {
      throw exchangedError;
    }
  } catch (error) {
    if (isMetaApiError(error) && error.kind === 'meta') throw error;
  }

  if (!appSecret) {
    throw new Error(
      'El servidor no pudo canjear el código y no hay App Secret en esta sesión. Pégalo en la configuración de Embedded Signup e inténtalo de nuevo. El código ya caducó: hay que abrir Facebook otra vez.',
    );
  }
  return exchangeCodeForToken({ version, appId, appSecret, code });
}

function ConnectPanel({ clinicId, capabilities, onConnected, onCancel }: ConnectPanelProps) {
  const queryClient = useQueryClient();
  const localApp = readLocalMetaApp();
  const [method, setMethod] = useState<Method>(capabilities.appId && capabilities.configId ? 'embedded' : 'credentials');
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  const [coexistence, setCoexistence] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  const appId = capabilities.appId || localApp.appId;
  const configId = capabilities.configId || localApp.configId;
  const hasSecret = capabilities.hasAppSecret || Boolean(readSessionAppSecret());
  const embeddedReady = Boolean(appId && configId && (hasSecret || capabilities.hasAppSecret));

  useEffect(() => {
    if (method !== 'embedded' || !appId) return;
    let cancelled = false;
    void loadFacebookSdk()
      .then(() => {
        if (cancelled) return;
        initFacebookSdk(appId, capabilities.graphVersion);
        setSdkReady(true);
        setSdkError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSdkError(error instanceof Error ? error.message : 'No se pudo cargar Facebook.');
      });
    return () => {
      cancelled = true;
    };
  }, [method, appId, capabilities.graphVersion]);

  const credentialsForm = useAppForm<ConnectValues>({
    schema: connectSchema,
    defaultValues: {
      accessToken: '',
      phoneNumberId: '',
      wabaId: '',
      appId: appId ?? '',
      appSecret: '',
    },
    onSubmit: async (values) => {
      await runCredentialSync(values);
    },
  });

  const embeddedForm = useAppForm<EmbeddedConfigValues>({
    schema: embeddedConfigSchema,
    defaultValues: {
      appId: appId ?? '',
      configId: configId ?? '',
      appSecret: '',
      solutionId: capabilities.solutionId ?? localApp.solutionId,
      pin: '',
    },
    onSubmit: async (values) => {
      await persistEmbeddedConfig(values);
    },
  });

  async function persistEmbeddedConfig(values: EmbeddedConfigValues) {
    setFailure(null);
    saveLocalMetaApp({
      appId: values.appId,
      configId: values.configId,
      solutionId: values.solutionId,
    });
    if (values.appSecret) saveSessionAppSecret(values.appSecret);
    try {
      const next = await saveAppConfig({
        appId: values.appId,
        appSecret: values.appSecret,
        configId: values.configId,
        solutionId: values.solutionId,
      });
      queryClient.setQueryData(['whatsapp-capabilities'], next);
      toast.success('Configuración de Meta guardada. Ya puedes continuar con Facebook.');
    } catch (error) {
      toast.message('Guardamos la configuración en este navegador. El servidor no pudo almacenarla.', {
        description: errorText(error),
      });
    }
  }

  async function finishSync(input: {
    accessToken: string;
    phoneNumberId: string;
    wabaId?: string;
    appId?: string;
    appSecret?: string;
    businessId?: string | null;
    method: 'cloud_api' | 'embedded_signup';
    pin?: string;
    coexistence?: boolean;
  }) {
    const mode = capabilities.serverCanReachMeta ? 'server' : 'browser';
    const caller = await createGraphCaller({
      clinicId,
      version: capabilities.graphVersion,
      mode,
      accessToken: input.accessToken,
    });

    const inspection = await inspectAccount(
      caller,
      {
        accessToken: input.accessToken,
        phoneNumberId: input.phoneNumberId,
        wabaId: input.wabaId,
        appId: input.appId,
        appSecret: input.appSecret,
      },
      setProgress,
    );

    if (input.pin && !input.coexistence && inspection.phone.is_on_biz_app !== true) {
      setProgress('Registrando el número en Cloud API…');
      try {
        await registerPhone(caller, inspection.phone.id, input.pin);
      } catch (error) {
        const already = isMetaApiError(error) && /already registered|ya está registrado/i.test(error.originalMessage);
        if (!already) throw error;
      }
    }

    if (inspection.waba?.id && capabilities.webhookVerifyToken && window.location.protocol === 'https:') {
      setProgress('Suscribiendo webhooks de la cuenta…');
      try {
        await subscribeApp(caller, inspection.waba.id, {
          callbackUrl: `${window.location.origin}${capabilities.webhookPath}`,
          verifyToken: capabilities.webhookVerifyToken,
        });
      } catch (error) {
        inspection.warnings.push(
          isMetaApiError(error)
            ? `No se pudo activar el webhook automáticamente: ${error.message}`
            : 'No se pudo activar el webhook automáticamente. Puedes hacerlo en la pestaña Webhook.',
        );
      }
    }

    setProgress('Guardando la sincronización…');
    const connection = inspectionToSnapshot(inspection, {
      clinicId,
      tokenStorage: mode,
      tokenPreview: maskToken(input.accessToken),
      method: input.method,
      graphVersion: capabilities.graphVersion,
      notices: createDefaultNotices(),
      appId: input.appId || null,
      businessId: input.businessId ?? null,
    });

    if (mode === 'server') {
      await saveServerConnection(clinicId, connection, input.accessToken);
      saveConnection({ ...connection, tokenStorage: 'server' }, null);
    } else {
      saveConnection({ ...connection, tokenStorage: 'browser' }, input.accessToken);
    }

    toast.success(
      connection.verifiedName
        ? `${connection.verifiedName} quedó sincronizada con Meta.`
        : 'WhatsApp quedó sincronizado con Meta.',
    );
    onConnected();
  }

  async function runCredentialSync(values: ConnectValues) {
    setFailure(null);
    setProgress('Contactando a Meta…');
    try {
      if (values.appSecret) saveSessionAppSecret(values.appSecret);
      await finishSync({
        accessToken: values.accessToken.trim(),
        phoneNumberId: values.phoneNumberId.trim(),
        wabaId: values.wabaId.trim() || undefined,
        appId: values.appId.trim() || undefined,
        appSecret: values.appSecret.trim() || undefined,
        method: 'cloud_api',
      });
    } catch (error) {
      setFailure(error);
      toast.error(errorText(error));
    } finally {
      setProgress(null);
    }
  }

  function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void credentialsForm.handleSubmit();
  }

  function handleEmbeddedConfigSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void embeddedForm.handleSubmit();
  }

  function handleFacebookClick() {
    if (!window.FB || !configId) {
      toast.error(sdkError ?? 'Espera a que cargue Facebook o revisa el App ID.');
      return;
    }
    const pin = embeddedForm.state.values.pin.trim();
    if (!coexistence && !/^\d{6}$/.test(pin)) {
      toast.error('Elige un PIN de 6 dígitos. Será la verificación en dos pasos del número.');
      return;
    }

    setFailure(null);
    setProgress('Abriendo Facebook…');
    try {
      launchEmbeddedSignup({
        configId,
        solutionId: capabilities.solutionId || embeddedForm.state.values.solutionId,
        coexistence,
        onSession: (session) => {
          if (session.event === 'CANCEL' && session.errorMessage) {
            toast.error(session.errorMessage);
          }
        },
        onCancel: (session) => {
          setProgress(null);
          if (session?.errorMessage) {
            toast.error(session.errorMessage);
            return;
          }
          toast.info('Cerraste Facebook antes de terminar. Puedes intentarlo de nuevo.');
        },
        onCode: (code, session) => {
          void completeEmbedded(code, session, pin);
        },
      });
    } catch (error) {
      setProgress(null);
      toast.error(errorText(error));
    }
  }

  async function completeEmbedded(code: string, session: EmbeddedSessionInfo | null, pin: string) {
    setProgress('Canjeando el código con Meta…');
    try {
      const secret = readSessionAppSecret();
      const exchanged = await exchangeEmbeddedCode(capabilities.graphVersion, code, appId, secret);
      const caller = await createGraphCaller({
        clinicId,
        version: capabilities.graphVersion,
        mode: capabilities.serverCanReachMeta ? 'server' : 'browser',
        accessToken: exchanged.accessToken,
      });

      let phoneNumberId = session?.phoneNumberId ?? null;
      let wabaId = session?.wabaId ?? null;
      if (wabaId && !phoneNumberId) {
        setProgress('Buscando el número dentro de la cuenta…');
        const listed = await caller.request<{ data?: Array<{ id: string }> }>({
          path: `${wabaId}/phone_numbers`,
          query: { fields: 'id', limit: 20 },
        });
        phoneNumberId = listed.data?.[0]?.id ?? null;
      }
      if (!phoneNumberId) {
        throw new Error(
          'Facebook terminó, pero no recibimos el Phone number ID. Si cerraste en un paso intermedio, vuelve a entrar y verifica el número. Si solo compartiste la cuenta, agrega el teléfono en el Administrador de WhatsApp.',
        );
      }

      await finishSync({
        accessToken: exchanged.accessToken,
        phoneNumberId,
        wabaId: wabaId ?? undefined,
        appId,
        appSecret: secret || undefined,
        businessId: session?.businessId,
        method: 'embedded_signup',
        pin: pin || undefined,
        coexistence: coexistence || session?.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
      });
    } catch (error) {
      setFailure(error);
      toast.error(errorText(error));
    } finally {
      setProgress(null);
    }
  }

  const inFrame = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)]">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Sincronizar WhatsApp</CardTitle>
          <CardDescription>
            MediPlan llama a Graph API {capabilities.graphVersion}. Si Meta rechaza el token o el número, no
            marcamos la clínica como conectada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Forma de sincronizar">
            <button
              type="button"
              role="radio"
              aria-checked={method === 'credentials'}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition-colors',
                method === 'credentials' ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
              )}
              onClick={() => {
                setMethod('credentials');
              }}
            >
              <p className="text-sm font-semibold">Credenciales de Cloud API</p>
              <p className="mt-1 text-xs text-muted-foreground">Pegas el token y el Phone number ID. Funciona con tu propia app de Meta.</p>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={method === 'embedded'}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition-colors',
                method === 'embedded' ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
              )}
              onClick={() => {
                setMethod('embedded');
              }}
            >
              <p className="text-sm font-semibold">Continuar con Facebook</p>
              <p className="mt-1 text-xs text-muted-foreground">Embedded Signup v4. La clínica autoriza sin copiar el token.</p>
            </button>
          </div>

          {method === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate aria-busy={Boolean(progress)}>
              <credentialsForm.Field name="accessToken" validators={{ onBlur: connectSchema.shape.accessToken }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Token de acceso permanente</Label>
                    <div className="relative">
                      <Input
                        id={field.name}
                        name={field.name}
                        type={showToken ? 'text' : 'password'}
                        autoComplete="off"
                        spellCheck={false}
                        className="pr-10 font-mono text-xs"
                        placeholder="EAAJ…"
                        value={field.state.value}
                        onChange={(event) => {
                          field.handleChange(event.target.value.replace(/\s/g, ''));
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={!field.state.meta.isValid}
                      />
                      <button
                        type="button"
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                        aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
                        onClick={() => {
                          setShowToken((visible) => !visible);
                        }}
                      >
                        {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldHint>
                      Usuario del sistema → Generar token → caducidad Nunca → permisos whatsapp_business_messaging y
                      whatsapp_business_management. No uses el token de API Setup: caduca en 24 horas.
                    </FieldHint>
                    <FieldErrors errors={field.state.meta.errors} />
                  </div>
                )}
              </credentialsForm.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <credentialsForm.Field name="phoneNumberId" validators={{ onBlur: connectSchema.shape.phoneNumberId }}>
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Phone number ID</Label>
                      <Input
                        id={field.name}
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="106540352242922"
                        value={field.state.value}
                        onChange={(event) => {
                          field.handleChange(event.target.value.replace(/\s/g, ''));
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={!field.state.meta.isValid}
                      />
                      <FieldHint>Identificador del número, no el teléfono. WhatsApp → API Setup.</FieldHint>
                      <FieldErrors errors={field.state.meta.errors} />
                    </div>
                  )}
                </credentialsForm.Field>
                <credentialsForm.Field name="wabaId" validators={{ onBlur: connectSchema.shape.wabaId }}>
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>WABA ID</Label>
                      <Input
                        id={field.name}
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="102290129340398"
                        value={field.state.value}
                        onChange={(event) => {
                          field.handleChange(event.target.value.replace(/\s/g, ''));
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={!field.state.meta.isValid}
                      />
                      <FieldHint>WhatsApp Business Account ID. Hace falta para plantillas y webhooks.</FieldHint>
                      <FieldErrors errors={field.state.meta.errors} />
                    </div>
                  )}
                </credentialsForm.Field>
              </div>

              <details className="rounded-lg border px-3 py-2 text-sm">
                <summary className="cursor-pointer font-medium">Diagnóstico opcional (App ID y App Secret)</summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <credentialsForm.Field name="appId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="diag-app-id">App ID</Label>
                        <Input
                          id="diag-app-id"
                          inputMode="numeric"
                          value={field.state.value}
                          onChange={(event) => {
                            field.handleChange(event.target.value.replace(/\s/g, ''));
                          }}
                        />
                      </div>
                    )}
                  </credentialsForm.Field>
                  <credentialsForm.Field name="appSecret">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="diag-app-secret">App Secret</Label>
                        <Input
                          id="diag-app-secret"
                          type="password"
                          autoComplete="off"
                          value={field.state.value}
                          onChange={(event) => {
                            field.handleChange(event.target.value.trim());
                          }}
                        />
                      </div>
                    )}
                  </credentialsForm.Field>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Solo si quieres que debug_token confirme caducidad y permisos. El secreto se usa en esta sesión y no
                  se vuelve a mostrar.
                </p>
              </details>

              {failure ? <MetaErrorDetails error={failure} /> : null}
              {progress ? <p className="text-sm text-primary">{progress}</p> : null}

              <div className="flex flex-wrap gap-2">
                <credentialsForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button type="submit" disabled={isSubmitting || Boolean(progress)}>
                      {isSubmitting || progress ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
                      Sincronizar con Meta
                    </Button>
                  )}
                </credentialsForm.Subscribe>
                {onCancel ? (
                  <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {!embeddedReady ? (
                <form onSubmit={handleEmbeddedConfigSubmit} className="space-y-4" noValidate>
                  <p className="text-sm text-muted-foreground">
                    Antes del botón de Facebook, esta app necesita el App ID, el Configuration ID de Facebook Login
                    for Business y el App Secret. La guía de abajo describe la pantalla exacta. Embedded Signup v2 y
                    v3 caducan el 15 de octubre de 2026: la configuración debe ser v4.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <embeddedForm.Field name="appId">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>App ID</Label>
                          <Input
                            id={field.name}
                            inputMode="numeric"
                            value={field.state.value}
                            onChange={(event) => {
                              field.handleChange(event.target.value.replace(/\s/g, ''));
                            }}
                            aria-invalid={!field.state.meta.isValid}
                          />
                          <FieldErrors errors={field.state.meta.errors} />
                        </div>
                      )}
                    </embeddedForm.Field>
                    <embeddedForm.Field name="configId">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Configuration ID</Label>
                          <Input
                            id={field.name}
                            inputMode="numeric"
                            value={field.state.value}
                            onChange={(event) => {
                              field.handleChange(event.target.value.replace(/\s/g, ''));
                            }}
                            aria-invalid={!field.state.meta.isValid}
                          />
                          <FieldErrors errors={field.state.meta.errors} />
                        </div>
                      )}
                    </embeddedForm.Field>
                  </div>
                  <embeddedForm.Field name="appSecret">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>App Secret</Label>
                        <div className="relative">
                          <Input
                            id={field.name}
                            type={showSecret ? 'text' : 'password'}
                            autoComplete="off"
                            className="pr-10"
                            value={field.state.value}
                            onChange={(event) => {
                              field.handleChange(event.target.value.trim());
                            }}
                            aria-invalid={!field.state.meta.isValid}
                          />
                          <button
                            type="button"
                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground"
                            aria-label={showSecret ? 'Ocultar secreto' : 'Mostrar secreto'}
                            onClick={() => {
                              setShowSecret((visible) => !visible);
                            }}
                          >
                            {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        <FieldHint>Configuración de la app → Básica. No lo envíes por chat.</FieldHint>
                        <FieldErrors errors={field.state.meta.errors} />
                      </div>
                    )}
                  </embeddedForm.Field>
                  <embeddedForm.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button type="submit" variant="secondary" disabled={isSubmitting}>
                        {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
                        Guardar configuración de la app
                      </Button>
                    )}
                  </embeddedForm.Subscribe>
                </form>
              ) : (
                <p className="rounded-lg bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
                  App {appId} lista para Embedded Signup. El dominio que debes autorizar en Meta es{' '}
                  <span className="font-medium text-foreground">{window.location.host}</span>.
                </p>
              )}

              <div className="space-y-3 rounded-xl border p-4">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={coexistence}
                    onCheckedChange={(checked) => {
                      setCoexistence(checked === true);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">Usar el número que ya está en la app WhatsApp Business</span>
                    <span className="mt-1 block text-muted-foreground">
                      Coexistencia: el mismo número sigue en el teléfono y también envía avisos por la API. No se
                      registra de nuevo ni se pide PIN.
                    </span>
                  </span>
                </label>
                {!coexistence ? (
                  <embeddedForm.Field name="pin">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="es-pin">PIN de verificación en dos pasos</Label>
                        <Input
                          id="es-pin"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={6}
                          placeholder="6 dígitos"
                          value={field.state.value}
                          onChange={(event) => {
                            field.handleChange(event.target.value.replace(/\D/g, '').slice(0, 6));
                          }}
                        />
                        <FieldHint>
                          Si el número es nuevo, elige un PIN y guárdalo. Si ya tenía verificación en dos pasos, escribe
                          ese mismo PIN.
                        </FieldHint>
                      </div>
                    )}
                  </embeddedForm.Field>
                ) : null}
                {inFrame ? (
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Este panel está dentro de una vista embebida. Si Facebook no abre la ventana, permite emergentes o
                    abre MediPlan en una pestaña nueva.
                  </p>
                ) : null}
                {sdkError ? <p className="text-sm text-destructive">{sdkError}</p> : null}
                {failure ? <MetaErrorDetails error={failure} /> : null}
                {progress ? <p className="text-sm text-primary">{progress}</p> : null}
                <Button
                  type="button"
                  className="bg-[#1877F2] text-white hover:bg-[#1877F2]/90"
                  disabled={!embeddedReady || !sdkReady || Boolean(progress)}
                  onClick={handleFacebookClick}
                >
                  {progress ? <LoaderCircle className="animate-spin" /> : null}
                  Continuar con Facebook
                </Button>
                {!sdkReady && embeddedReady ? (
                  <p className="text-xs text-muted-foreground">Cargando el SDK de Facebook…</p>
                ) : null}
              </div>
              {onCancel ? (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold">Qué podrá enviar la clínica</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {OUTCOMES.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Si ya tienes la app de Meta, la sincronización toma un par de minutos. Empezar de cero suele llevar 20-40
            minutos; la verificación del negocio puede tardar más y no bloquea la prueba.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-sm shadow-sm">
          <p className="font-semibold">Cómo se hace la llamada</p>
          <p className="mt-2 text-muted-foreground">
            {capabilities.serverCanReachMeta
              ? 'El servidor de MediPlan llama a graph.facebook.com y guarda el token fuera del navegador.'
              : 'Tu navegador llama directo a graph.facebook.com, porque este servidor no tiene salida a Facebook. El token queda solo en este navegador.'}
          </p>
          <a href="#guia-meta" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Ver instrucciones paso a paso
          </a>
        </div>
      </aside>
    </div>
  );
}

export function useWhatsAppCapabilities() {
  return useQuery({
    queryKey: ['whatsapp-capabilities'],
    queryFn: fetchCapabilities,
    staleTime: 60_000,
  });
}

export { ConnectPanel };
