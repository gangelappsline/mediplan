import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  LoaderCircle,
  RefreshCw,
  Send,
  Unplug,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { createGraphCaller, deleteServerConnection, fetchWebhookEvents } from '@/features/whatsapp/api';
import {
  BUSINESS_VERTICALS,
  COUNTRY_CODES,
  NOTICE_CATALOG,
  TEMPLATE_LANGUAGES,
  renderTemplateBody,
} from '@/features/whatsapp/catalog';
import {
  accountStatusLabel,
  formatTokenExpiry,
  formatWhen,
  limitLabel,
  nameStatusLabel,
  qualityLabel,
  qualityTone,
  verificationLabel,
} from '@/features/whatsapp/labels';
import { errorText } from '@/features/whatsapp/meta/errors';
import {
  createRecommendedTemplates,
  getBusinessProfile,
  inspectAccount,
  inspectionToSnapshot,
  isApproved,
  listTemplates,
  registerPhone,
  sendMany,
  sendTemplateMessage,
  sendTextMessage,
  startCoexistenceSync,
  subscribeApp,
  templateStatus,
  updateBusinessProfile,
} from '@/features/whatsapp/meta/operations';
import { isPlausibleE164, parseRecipientList } from '@/features/whatsapp/meta/phone';
import { profileSchema, registerPinSchema, type ProfileValues, type RegisterPinValues } from '@/features/whatsapp/schemas';
import { clearConnection, readAccessToken, saveConnection, updateNotices } from '@/features/whatsapp/storage';
import type { MetaCapabilities, MetaTemplate, NoticeKind, PublicConnection, SendResult } from '@/features/whatsapp/types';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { cn } from '@/shared/lib/utils';

interface ConnectedPanelProps {
  clinicId: string;
  clinicName: string;
  connection: PublicConnection;
  capabilities: MetaCapabilities;
  onReconnect: () => void;
  onDisconnected: () => void;
}

type TabId = 'avisos' | 'plantillas' | 'perfil' | 'webhook';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'avisos', label: 'Avisos' },
  { id: 'plantillas', label: 'Plantillas' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'webhook', label: 'Webhook' },
];

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
  } catch {
    toast.error('No se pudo copiar. Selecciona el texto manualmente.');
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function ConnectedPanel({
  clinicId,
  clinicName,
  connection,
  capabilities,
  onReconnect,
  onDisconnected,
}: ConnectedPanelProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('avisos');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [noticeId, setNoticeId] = useState<NoticeKind>('appointment_confirmation');
  const [phones, setPhones] = useState('');
  const [countryCode, setCountryCode] = useState('52');
  const [variables, setVariables] = useState<string[]>(['', clinicName, '', '']);
  const [consent, setConsent] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const [templateLanguage, setTemplateLanguage] = useState(connection.notices.appointment_confirmation.language);
  const [templateResults, setTemplateResults] = useState<Array<{ name: string; ok: boolean; detail: string }>>([]);
  const [sessionText, setSessionText] = useState('');
  const [sessionPhone, setSessionPhone] = useState('');

  const notice = NOTICE_CATALOG.find((item) => item.id === noticeId) ?? NOTICE_CATALOG[0];
  const webhookUrl = `${window.location.origin}${capabilities.webhookPath}`;

  const callerPromise = useMemo(
    () =>
      createGraphCaller({
        clinicId,
        version: connection.graphVersion,
        mode: connection.tokenStorage,
      }),
    [clinicId, connection.graphVersion, connection.tokenStorage, connection.updatedAt],
  );

  const templatesQuery = useQuery({
    queryKey: ['whatsapp-templates', clinicId, connection.wabaId, connection.lastCheckedAt],
    queryFn: async () => {
      if (!connection.wabaId) return [] as MetaTemplate[];
      const caller = await callerPromise;
      return listTemplates(caller, connection.wabaId);
    },
    enabled: Boolean(connection.wabaId),
  });

  const eventsQuery = useQuery({
    queryKey: ['whatsapp-events'],
    queryFn: fetchWebhookEvents,
    enabled: tab === 'webhook',
    refetchInterval: tab === 'webhook' ? 15_000 : false,
  });

  const matchedTemplate = templateStatus(
    templatesQuery.data ?? [],
    connection.notices[notice.id].templateName,
    connection.notices[notice.id].language,
  );

  async function refreshFromMeta() {
    setBusy('refresh');
    try {
      const caller = await callerPromise;
      const inspection = await inspectAccount(caller, {
        accessToken: readAccessToken(clinicId) ?? undefined,
        phoneNumberId: connection.phoneNumberId,
        wabaId: connection.wabaId ?? undefined,
        appId: connection.appId ?? undefined,
      });
      const profile = await getBusinessProfile(caller, connection.phoneNumberId);
      const next = inspectionToSnapshot(
        { ...inspection, profile: profile ?? inspection.profile },
        {
          clinicId,
          tokenStorage: connection.tokenStorage,
          tokenPreview: connection.tokenPreview,
          method: connection.method,
          graphVersion: connection.graphVersion,
          notices: connection.notices,
          appId: connection.appId,
          businessId: connection.businessId,
          connectedAt: connection.connectedAt,
        },
      );
      if (next.tokenExpiresAt === null) next.tokenExpiresAt = connection.tokenExpiresAt;
      if (next.tokenIsValid === null) next.tokenIsValid = connection.tokenIsValid;
      if (next.scopes.length === 0) next.scopes = connection.scopes;
      saveConnection(next, null);
      await queryClient.invalidateQueries({ queryKey: ['whatsapp-templates', clinicId] });
      toast.success('Datos actualizados desde Meta.');
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    clearConnection(clinicId);
    await deleteServerConnection(clinicId);
    toast.success('WhatsApp desconectado de MediPlan. El número sigue activo en Meta.');
    onDisconnected();
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!notice) return;
    const setting = connection.notices[notice.id];
    const values = variables.slice(0, notice.variables.length).map((value) => value.trim());
    if (values.some((value) => !value)) {
      toast.error('Completa los datos del aviso antes de enviarlo.');
      return;
    }
    if (notice.category === 'MARKETING' && !consent) {
      toast.error('Las promociones y descuentos solo se envían si el paciente aceptó recibirlos.');
      return;
    }
    const recipients = parseRecipientList(phones, countryCode);
    if (recipients.length === 0 || recipients.some((item) => !isPlausibleE164(item))) {
      toast.error('Escribe teléfonos válidos, con código de país o 10 dígitos locales.');
      return;
    }
    if (phones.split(/[\n,;]+/).filter((item) => item.trim()).length > 20) {
      toast.error('Por seguridad, este envío admite hasta 20 números. Repite el lote si necesitas más.');
      return;
    }
    if (matchedTemplate && !isApproved(matchedTemplate)) {
      toast.error(`La plantilla ${setting.templateName} está en estado ${matchedTemplate.status}. Meta debe aprobarla antes del envío.`);
      return;
    }

    setBusy('send');
    setResults([]);
    try {
      const caller = await callerPromise;
      const sent = await sendMany(recipients, (to) =>
        sendTemplateMessage(caller, {
          phoneNumberId: connection.phoneNumberId,
          to,
          templateName: setting.templateName,
          language: setting.language,
          variables: values,
        }),
      );
      setResults(sent);
      const ok = sent.filter((item) => item.ok).length;
      if (ok === sent.length) toast.success(ok === 1 ? 'Meta aceptó el aviso.' : `Meta aceptó ${ok} avisos.`);
      else toast.error(`${ok} de ${sent.length} aceptados. Revisa el detalle.`);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleSessionSend(event: FormEvent) {
    event.preventDefault();
    const recipients = parseRecipientList(sessionPhone, countryCode, 1);
    if (!recipients[0] || !sessionText.trim()) {
      toast.error('Escribe un teléfono y el texto.');
      return;
    }
    setBusy('session');
    try {
      const caller = await callerPromise;
      const messageId = await sendTextMessage(caller, {
        phoneNumberId: connection.phoneNumberId,
        to: recipients[0],
        body: sessionText.trim(),
      });
      toast.success(`Texto enviado. id ${messageId}`);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateTemplates() {
    if (!connection.wabaId) {
      toast.error('Falta el WABA ID. Vuelve a sincronizar e inclúyelo.');
      return;
    }
    setBusy('templates');
    try {
      const caller = await callerPromise;
      const created = await createRecommendedTemplates(caller, connection.wabaId, templateLanguage, (message) => {
        setBusy(message);
      });
      setTemplateResults(created);
      await queryClient.invalidateQueries({ queryKey: ['whatsapp-templates', clinicId] });
      toast.success('Plantillas enviadas a Meta. La aprobación no es inmediata.');
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleSubscribe(withOverride: boolean) {
    if (!connection.wabaId) {
      toast.error('Sin WABA ID no se puede suscribir la app.');
      return;
    }
    setBusy('webhook');
    try {
      const caller = await callerPromise;
      await subscribeApp(
        caller,
        connection.wabaId,
        withOverride
          ? { callbackUrl: webhookUrl, verifyToken: capabilities.webhookVerifyToken }
          : undefined,
      );
      toast.success(withOverride ? 'Meta verificó el webhook y suscribió la cuenta.' : 'App suscrita a la cuenta.');
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleCoexistenceSync() {
    setBusy('coexistence');
    try {
      const caller = await callerPromise;
      const contacts = await startCoexistenceSync(caller, connection.phoneNumberId, 'smb_app_state_sync');
      const history = await startCoexistenceSync(caller, connection.phoneNumberId, 'history');
      toast.success('Meta inició la sincronización. Mantén abierta la app WhatsApp Business.');
      if (contacts || history) {
        toast.message('Referencias de la solicitud', {
          description: [contacts, history].filter(Boolean).join(' · '),
        });
      }
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  }

  const preview = renderTemplateBody(notice.body, variables);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Sincronizado con Meta</Badge>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', qualityTone(connection.qualityRating))}>
                Calidad {qualityLabel(connection.qualityRating)}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {connection.verifiedName || connection.wabaName || 'Número de la clínica'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {connection.displayPhoneNumber || 'Teléfono no informado'} · {connection.graphVersion}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void refreshFromMeta()} disabled={Boolean(busy)}>
              {busy === 'refresh' ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
              Actualizar desde Meta
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onReconnect}>
              Cambiar credenciales
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDisconnect(true)}>
              <Unplug />
              Desconectar
            </Button>
          </div>
        </div>

        {confirmDisconnect ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm">
            <p>Esto solo olvida la conexión en MediPlan. No borra el número ni las plantillas en Meta.</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="destructive" onClick={() => void handleDisconnect()}>
                Sí, desconectar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDisconnect(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Estado del número" value={accountStatusLabel(connection.status)} />
          <Stat label="Nombre para mostrar" value={nameStatusLabel(connection.nameStatus)} />
          <Stat label="Límite de Meta" value={limitLabel(connection.messagingLimitTier)} />
          <Stat label="Token" value={`${connection.tokenPreview} · ${formatTokenExpiry(connection.tokenExpiresAt)}`} />
          <Stat label="Phone number ID" value={connection.phoneNumberId} />
          <Stat label="WABA" value={connection.wabaName || connection.wabaId || 'No vinculado'} />
          <Stat label="Verificación del negocio" value={verificationLabel(connection.businessVerificationStatus)} />
          <Stat label="Última lectura" value={formatWhen(connection.lastCheckedAt)} />
        </div>

        {connection.warnings.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {connection.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
        {!connection.wabaId ? (
          <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
            Sin WABA ID no se pueden crear plantillas ni webhooks. Pulsa «Cambiar credenciales» y pega el WhatsApp
            Business Account ID de API Setup.
          </p>
        ) : null}
      </section>

      <div role="tablist" aria-label="Secciones de WhatsApp" className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap',
              tab === item.id ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'avisos' ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_280px]">
          <form onSubmit={handleSend} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm" noValidate>
            <div>
              <h3 className="font-semibold">Enviar un aviso</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sale por Cloud API, con la plantilla asignada. La agenda automática usará estas mismas plantillas
                cuando esté activa; hoy el envío es manual y real.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tipo de aviso</Label>
              <Select
                value={notice.id}
                onValueChange={(value) => {
                  const next = NOTICE_CATALOG.find((item) => item.id === value);
                  setNoticeId(value as NoticeKind);
                  setVariables(next?.variables.map((variable) => (variable.key === 'clinic' ? clinicName : '')) ?? []);
                  setConsent(false);
                  setResults([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_CATALOG.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Plantilla {connection.notices[notice.id].templateName} · {connection.notices[notice.id].language}
                {matchedTemplate ? ` · ${matchedTemplate.status}` : ' · aún no aparece en Meta'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {notice.variables.map((variable, index) => (
                <div key={variable.key} className="space-y-2">
                  <Label htmlFor={`var-${variable.key}`}>{variable.label}</Label>
                  <Input
                    id={`var-${variable.key}`}
                    value={variables[index] ?? ''}
                    placeholder={variable.placeholder}
                    onChange={(event) => {
                      setVariables((current) => {
                        const next = [...current];
                        next[index] = event.target.value;
                        return next;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <div className="space-y-2">
                <Label>Código de país</Label>
                <Select value={countryCode || 'none'} onValueChange={(value) => setCountryCode(value === 'none' ? '' : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((item) => (
                      <SelectItem key={item.label} value={item.value || 'none'}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phones">Teléfonos</Label>
                <Textarea
                  id="phones"
                  value={phones}
                  placeholder={'5512345678\n5587654321'}
                  onChange={(event) => setPhones(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Uno por línea. Si escribes 10 dígitos, se agrega el código de país. Máximo 20 por envío.
                </p>
              </div>
            </div>
            {notice.category === 'MARKETING' ? (
              <label className="flex items-start gap-3 text-sm">
                <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
                <span>Confirmo que estos pacientes aceptaron recibir promociones de la clínica por WhatsApp.</span>
              </label>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={connection.notices[notice.id].enabled}
                  onCheckedChange={(checked) => {
                    updateNotices(clinicId, {
                      ...connection.notices,
                      [notice.id]: { ...connection.notices[notice.id], enabled: checked === true },
                    });
                  }}
                />
                Usar este aviso cuando la agenda lo dispare
              </label>
              {notice.id === 'appointment_reminder' ? (
                <Select
                  value={String(connection.notices.appointment_reminder.hoursBefore ?? 24)}
                  onValueChange={(value) => {
                    updateNotices(clinicId, {
                      ...connection.notices,
                      appointment_reminder: {
                        ...connection.notices.appointment_reminder,
                        hoursBefore: Number(value),
                      },
                    });
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 horas antes</SelectItem>
                    <SelectItem value="2">2 horas antes</SelectItem>
                    <SelectItem value="1">1 hora antes</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
            </div>
            <Button type="submit" disabled={Boolean(busy)}>
              {busy === 'send' ? <LoaderCircle className="animate-spin" /> : <Send />}
              Enviar por WhatsApp
            </Button>
            {results.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {results.map((result) => (
                  <li key={result.to} className={result.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-destructive'}>
                    {result.to}: {result.ok ? result.messageId : result.error}
                  </li>
                ))}
              </ul>
            ) : null}
          </form>

          <div className="space-y-4">
            <div className="rounded-[1.6rem] border bg-zinc-950 p-3 text-white shadow-lg">
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-300">
                <span className="size-2 rounded-full bg-[#25D366]" />
                {connection.verifiedName || clinicName}
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] px-3 py-2 text-sm leading-relaxed">
                {preview}
                <p className="mt-2 text-[11px] text-white/70">{notice.footer}</p>
              </div>
            </div>
            <form onSubmit={handleSessionSend} className="space-y-3 rounded-xl border bg-card p-4 text-sm">
              <p className="font-medium">Texto libre</p>
              <p className="text-xs text-muted-foreground">
                Solo funciona si ese paciente escribió a la clínica en las últimas 24 horas. Si no, Meta responderá
                131047 y hay que usar la plantilla.
              </p>
              <Input
                value={sessionPhone}
                placeholder="Teléfono"
                onChange={(event) => setSessionPhone(event.target.value)}
                aria-label="Teléfono para texto libre"
              />
              <Textarea
                value={sessionText}
                placeholder="Hola, te escribimos de la clínica…"
                onChange={(event) => setSessionText(event.target.value)}
                aria-label="Texto libre"
              />
              <Button type="submit" variant="outline" size="sm" disabled={Boolean(busy)}>
                {busy === 'session' ? <LoaderCircle className="animate-spin" /> : null}
                Enviar texto
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {tab === 'plantillas' ? (
        <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold">Plantillas en la cuenta de Meta</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Crearlas no las aprueba. Meta las revisa y el estado pasa a APPROVED, PENDING o REJECTED. Hasta
                entonces no se pueden usar para iniciar un aviso.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={templateLanguage} onValueChange={setTemplateLanguage}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_LANGUAGES.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => void handleCreateTemplates()} disabled={Boolean(busy) || !connection.wabaId}>
                {busy && busy !== 'refresh' && busy !== 'send' ? <LoaderCircle className="animate-spin" /> : null}
                Crear plantillas recomendadas
              </Button>
            </div>
          </div>
          {templateResults.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {templateResults.map((result) => (
                <li key={result.name}>
                  <span className="font-medium">{result.name}:</span> {result.detail}
                </li>
              ))}
            </ul>
          ) : null}
          {!connection.wabaId ? <p className="text-sm text-muted-foreground">Conecta el WABA ID para listar plantillas.</p> : null}
          {templatesQuery.isLoading ? <p className="text-sm text-muted-foreground">Leyendo plantillas en Meta…</p> : null}
          {templatesQuery.isError ? <p className="text-sm text-destructive">{errorText(templatesQuery.error)}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 font-medium">Nombre</th>
                  <th className="py-2 font-medium">Idioma</th>
                  <th className="py-2 font-medium">Categoría</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(templatesQuery.data ?? []).map((template) => (
                  <tr key={template.id} className="border-b border-border/70">
                    <td className="py-2 font-mono text-xs">{template.name}</td>
                    <td className="py-2">{template.language}</td>
                    <td className="py-2">{template.category}</td>
                    <td className="py-2">
                      {template.status}
                      {template.rejected_reason ? ` · ${template.rejected_reason}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {templatesQuery.data && templatesQuery.data.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">Esta cuenta todavía no tiene plantillas.</p>
            ) : null}
          </div>
          {connection.isOnBizApp ? (
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-medium">Sincronizar contactos e historial de la app</p>
              <p className="mt-1 text-muted-foreground">
                Solo se puede pedir una vez, dentro de las 24 horas posteriores a la coexistencia. Deja la app
                WhatsApp Business abierta. Los datos llegan por webhook, no en esta pantalla.
              </p>
              <Button type="button" className="mt-3" variant="outline" size="sm" onClick={() => void handleCoexistenceSync()} disabled={Boolean(busy)}>
                {busy === 'coexistence' ? <LoaderCircle className="animate-spin" /> : null}
                Iniciar sincronización de la app
              </Button>
            </div>
          ) : null}
          <RegisterPinForm
            busy={Boolean(busy)}
            onSubmit={async (pin) => {
              setBusy('pin');
              try {
                const caller = await callerPromise;
                await registerPhone(caller, connection.phoneNumberId, pin);
                toast.success('Número registrado en Cloud API.');
                await refreshFromMeta();
              } catch (error) {
                toast.error(errorText(error));
              } finally {
                setBusy(null);
              }
            }}
          />
        </section>
      ) : null}

      {tab === 'perfil' ? (
        <ProfileCard
          connection={connection}
          onSave={async (values) => {
            const caller = await callerPromise;
            await updateBusinessProfile(caller, connection.phoneNumberId, {
              about: values.about.trim(),
              address: values.address.trim(),
              description: values.description.trim(),
              email: values.email.trim(),
              websites: values.website ? [values.website.trim()] : [],
              vertical: values.vertical,
            });
            const profile = await getBusinessProfile(caller, connection.phoneNumberId);
            saveConnection({ ...connection, profile, updatedAt: new Date().toISOString() }, null);
            toast.success('Perfil actualizado en WhatsApp.');
          }}
        />
      ) : null}

      {tab === 'webhook' ? (
        <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div>
            <h3 className="font-semibold">Webhook de entregas y respuestas</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Meta llama a esta URL para avisar si el mensaje se entregó, si el paciente contestó y si una plantilla
              cambió de estado. Tiene que ser HTTPS. En localhost la verificación falla.
            </p>
          </div>
          <CopyRow label="URL de devolución de llamada" value={webhookUrl} />
          <CopyRow label="Token de verificación" value={capabilities.webhookVerifyToken || 'No disponible'} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSubscribe(true)} disabled={Boolean(busy) || !connection.wabaId}>
              {busy === 'webhook' ? <LoaderCircle className="animate-spin" /> : null}
              Activar webhooks en esta cuenta
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleSubscribe(false)} disabled={Boolean(busy) || !connection.wabaId}>
              Solo suscribir la app
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Vía manual: app de Meta → WhatsApp → Configuration. Pega la URL y el token, y suscríbete a messages,
            message_template_status_update, account_update y phone_number_quality_update.
          </p>
          <div>
            <h4 className="text-sm font-medium">Últimos eventos</h4>
            <ul className="mt-2 space-y-2">
              {(eventsQuery.data ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">Todavía no llega ningún webhook.</li>
              ) : (
                (eventsQuery.data ?? []).map((event) => (
                  <li key={event.id} className="rounded-lg border px-3 py-2 text-sm">
                    <p>{event.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatWhen(event.receivedAt)}
                      {event.field ? ` · ${event.field}` : ''}
                      {event.signatureVerified ? ' · firma válida' : ''}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" aria-label={`Copiar ${label}`} onClick={() => void copyText(value, label)}>
          <Copy />
        </Button>
      </div>
    </div>
  );
}

function RegisterPinForm({ busy, onSubmit }: { busy: boolean; onSubmit: (pin: string) => Promise<void> }) {
  const form = useAppForm<RegisterPinValues>({
    schema: registerPinSchema,
    defaultValues: { pin: '' },
    onSubmit: async (values) => {
      await onSubmit(values.pin);
    },
  });

  return (
    <form
      className="rounded-lg border p-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p className="text-sm font-medium">Registrar número en Cloud API</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Hazlo si el envío responde 133010. El PIN es la verificación en dos pasos. Un PIN incorrecto repetido puede
        bloquear el número.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <form.Field name="pin">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="register-pin">PIN</Label>
              <Input
                id="register-pin"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                className="w-32"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
                aria-invalid={!field.state.meta.isValid}
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
        <Button type="submit" variant="outline" disabled={busy}>
          Registrar
        </Button>
      </div>
    </form>
  );
}

function ProfileCard({
  connection,
  onSave,
}: {
  connection: PublicConnection;
  onSave: (values: ProfileValues) => Promise<void>;
}) {
  const form = useAppForm<ProfileValues>({
    schema: profileSchema,
    defaultValues: {
      about: connection.profile?.about ?? '',
      address: connection.profile?.address ?? '',
      description: connection.profile?.description ?? '',
      email: connection.profile?.email ?? '',
      website: connection.profile?.websites[0] ?? '',
      vertical: (['HEALTH', 'BEAUTY', 'PROF_SERVICES', 'OTHER'] as const).includes(
        connection.profile?.vertical as 'HEALTH',
      )
        ? (connection.profile?.vertical as ProfileValues['vertical'])
        : 'HEALTH',
    },
    onSubmit: async (values) => {
      try {
        await onSave(values);
      } catch (error) {
        toast.error(errorText(error));
      }
    },
  });

  return (
    <form
      className="max-w-2xl space-y-4 rounded-xl border bg-card p-5 shadow-sm"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div>
        <h3 className="font-semibold">Perfil de negocio en WhatsApp</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Se guarda con POST /{'{phone-number-id}'}/whatsapp_business_profile. Es lo que ve el paciente en el perfil
          del chat.
        </p>
      </div>
      <form.Field name="about">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Estado (about)</Label>
            <Input
              id={field.name}
              maxLength={139}
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={!field.state.meta.isValid}
            />
            <p className="text-xs text-muted-foreground">{field.state.value.length}/139</p>
            <FieldErrors errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="description">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Descripción</Label>
            <Textarea
              id={field.name}
              maxLength={512}
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldErrors errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="address">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Dirección</Label>
            <Input id={field.name} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
          </div>
        )}
      </form.Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Correo</Label>
              <Input id={field.name} type="email" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
        <form.Field name="website">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Sitio web</Label>
              <Input id={field.name} placeholder="https://" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </div>
      <form.Field name="vertical">
        {(field) => (
          <div className="space-y-2">
            <Label>Giro</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as ProfileValues['vertical'])}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_VERTICALS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
            Guardar perfil en Meta
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { ConnectedPanel };
