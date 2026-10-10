interface MetaErrorPayload {
  message?: string;
  type?: string;
  code?: number | string;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
  error_data?: { details?: string };
}

export type MetaErrorKind = 'meta' | 'network' | 'upstream';

export class MetaApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly subcode?: number;
  readonly type?: string;
  readonly fbtraceId?: string;
  readonly userTitle?: string;
  readonly userMessage?: string;
  readonly originalMessage: string;
  readonly kind: MetaErrorKind;

  constructor(details: {
    friendly: string;
    status: number;
    kind: MetaErrorKind;
    originalMessage: string;
    code?: number;
    subcode?: number;
    type?: string;
    fbtraceId?: string;
    userTitle?: string;
    userMessage?: string;
  }) {
    super(details.friendly);
    this.name = 'MetaApiError';
    this.status = details.status;
    this.kind = details.kind;
    this.originalMessage = details.originalMessage;
    this.code = details.code;
    this.subcode = details.subcode;
    this.type = details.type;
    this.fbtraceId = details.fbtraceId;
    this.userTitle = details.userTitle;
    this.userMessage = details.userMessage;
  }
}

export function isMetaApiError(error: unknown): error is MetaApiError {
  return error instanceof MetaApiError;
}

function friendlyFromCode(code: number | undefined, subcode: number | undefined, original: string): string {
  const text = original.toLowerCase();

  if (code === 190 || text.includes('expired') || text.includes('session has expired')) {
    return 'Meta rechazó el token. Si lo copiaste de WhatsApp → API Setup, ese token caduca en unas 24 horas. Crea un token permanente de un usuario del sistema, con los permisos whatsapp_business_messaging y whatsapp_business_management, y vuelve a sincronizar.';
  }

  if (code === 10 || code === 200 || text.includes('permission')) {
    return 'El token no tiene permiso sobre esta cuenta de WhatsApp. En Usuarios del sistema, asigna la app y la cuenta de WhatsApp Business con control total, y genera el token con whatsapp_business_messaging y whatsapp_business_management.';
  }

  if (code === 100 && (text.includes('does not exist') || text.includes('unsupported get request') || text.includes('nonexisting'))) {
    return 'Meta no encontró ese identificador. El Phone number ID no es el teléfono de la clínica: es el número largo que aparece en WhatsApp → API Setup, debajo del número, con la etiqueta Phone number ID.';
  }

  if (code === 131030 || text.includes('not in allowed list')) {
    return 'Estás usando el número de prueba de Meta. Solo puede escribir a teléfonos agregados en API Setup, en la lista de destinatarios. Agrega ahí el móvil de prueba o sincroniza el número real de la clínica.';
  }

  if (code === 131047 || text.includes('24 hours') || text.includes('re-engagement')) {
    return 'Pasaron más de 24 horas desde el último mensaje del paciente. Fuera de esa ventana, WhatsApp solo acepta plantillas aprobadas, no texto libre.';
  }

  if (code === 131026) {
    return 'WhatsApp no pudo entregar el mensaje. Revisa que el número del paciente esté en WhatsApp y tenga el código de país.';
  }

  if (code === 131051) {
    return 'Ese tipo de mensaje no está permitido en esta conversación. Usa una plantilla aprobada.';
  }

  if (code === 132000) {
    return 'La plantilla espera otra cantidad de datos. Revisa que cada variable {{1}}, {{2}}… tenga un valor.';
  }

  if (code === 132001 || text.includes('template name') || text.includes('does not exist in')) {
    return 'Esa plantilla no existe en este idioma en la cuenta de WhatsApp. Créala desde MediPlan y espera a que Meta la apruebe.';
  }

  if (code === 132015 || code === 132016 || text.includes('paused') || text.includes('disabled')) {
    return 'Meta pausó o desactivó esta plantilla, normalmente por baja calidad o por un reporte. Revísala en el Administrador de WhatsApp antes de reenviarla.';
  }

  if (code === 133010 || text.includes('not registered')) {
    return 'El número aún no está registrado en Cloud API. En el panel, abre «Registrar número» e indica el PIN de 6 dígitos de la verificación en dos pasos.';
  }

  if (code === 133005 || text.includes('pin')) {
    return 'El PIN de verificación en dos pasos no coincide. Usa el PIN que se eligió al registrar el número. Varios intentos fallidos pueden bloquearlo.';
  }

  if (code === 133015) {
    return 'Meta pide esperar unos minutos antes de volver a registrar este número. No reintentes el PIN de inmediato.';
  }

  if (code === 133006) {
    return 'Hay que volver a verificar el número por SMS o llamada en el Administrador de WhatsApp antes de registrarlo.';
  }

  if (code === 368) {
    return 'Meta bloqueó temporalmente el envío desde esta cuenta. Revisa la calidad del número y las políticas de WhatsApp antes de reintentar.';
  }

  if (code === 80007 || code === 4 || code === 130429) {
    return 'Meta limitó la velocidad de envío. Espera un momento y reintenta con menos mensajes.';
  }

  if (code === 33) {
    return 'El token no puede ver ese objeto. Confirma que el Phone number ID y el WABA ID pertenecen a la misma cuenta y que el usuario del sistema tiene el activo asignado.';
  }

  if (subcode === 2388024 || text.includes('already exists') || text.includes('duplicate')) {
    return 'Esa plantilla ya existe en este idioma. No hace falta crearla de nuevo: espera a que figure como aprobada.';
  }

  if (text.includes('payment') || text.includes('billing')) {
    return 'La cuenta no tiene un método de pago activo. Agrégalo en el Administrador de WhatsApp antes de enviar plantillas a pacientes reales.';
  }

  return 'Meta rechazó la operación. Revisa el detalle técnico y la guía de sincronización.';
}

export function metaErrorFromPayload(status: number, payload: unknown): MetaApiError {
  const record = payload && typeof payload === 'object' ? (payload as { error?: MetaErrorPayload; message?: string }) : null;
  const error = record?.error;
  const code = typeof error?.code === 'number' ? error.code : undefined;
  const original =
    error?.error_user_msg ||
    error?.message ||
    error?.error_data?.details ||
    record?.message ||
    `HTTP ${status}`;

  const upstream = error?.code === 'upstream_unreachable' || code === undefined && status === 503;
  if (upstream || error?.code === 'upstream_unreachable') {
    return new MetaApiError({
      friendly: 'El servidor de MediPlan no pudo llegar a Meta. Reintentaremos la llamada desde tu navegador.',
      status,
      kind: 'upstream',
      originalMessage: original,
    });
  }

  return new MetaApiError({
    friendly: friendlyFromCode(code, error?.error_subcode, original),
    status,
    kind: 'meta',
    originalMessage: original,
    code,
    subcode: error?.error_subcode,
    type: error?.type,
    fbtraceId: error?.fbtrace_id,
    userTitle: error?.error_user_title,
    userMessage: error?.error_user_msg,
  });
}

export function networkMetaError(error: unknown): MetaApiError {
  const original = error instanceof Error ? error.message : 'Fallo de red';
  const aborted = original.toLowerCase().includes('abort');
  return new MetaApiError({
    friendly: aborted
      ? 'Meta tardó demasiado en responder. Inténtalo de nuevo en unos segundos.'
      : 'No se pudo completar la llamada a graph.facebook.com. Revisa tu internet y que un bloqueador no esté cortando Facebook. Si el navegador bloquea la API, MediPlan la hace desde el servidor en cuanto ese servidor tenga salida a Meta.',
    status: 0,
    kind: 'network',
    originalMessage: original,
  });
}

export function errorText(error: unknown): string {
  if (isMetaApiError(error)) return error.message;
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
