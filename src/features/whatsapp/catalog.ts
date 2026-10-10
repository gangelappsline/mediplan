import type { NoticeDefinition, NoticeKind, NoticeSetting, NoticeSettings } from '@/features/whatsapp/types';

export const DEFAULT_TEMPLATE_LANGUAGE = 'es_MX';

export const TEMPLATE_LANGUAGES = [
  { value: 'es_MX', label: 'Español (México)' },
  { value: 'es', label: 'Español' },
  { value: 'es_ES', label: 'Español (España)' },
  { value: 'es_AR', label: 'Español (Argentina)' },
  { value: 'es_CO', label: 'Español (Colombia)' },
  { value: 'en_US', label: 'English (US)' },
] as const;

export const BUSINESS_VERTICALS = [
  { value: 'HEALTH', label: 'Salud' },
  { value: 'BEAUTY', label: 'Belleza y estética' },
  { value: 'PROF_SERVICES', label: 'Servicios profesionales' },
  { value: 'OTHER', label: 'Otro' },
] as const;

export const COUNTRY_CODES = [
  { value: '52', label: 'México +52' },
  { value: '34', label: 'España +34' },
  { value: '54', label: 'Argentina +54' },
  { value: '57', label: 'Colombia +57' },
  { value: '56', label: 'Chile +56' },
  { value: '51', label: 'Perú +51' },
  { value: '1', label: 'EE. UU. / Canadá +1' },
  { value: '', label: 'Ya incluye código de país' },
] as const;

/**
 * Plantillas que MediPlan crea en la WABA de la clínica.
 * El texto no empieza ni termina en una variable: Meta rechaza ese formato.
 * Las de citas y avisos operativos son UTILITY; promociones y descuentos, MARKETING.
 */
export const NOTICE_CATALOG: NoticeDefinition[] = [
  {
    id: 'appointment_confirmation',
    label: 'Confirmación de cita',
    description: 'Cuando agendas o confirmas una cita.',
    category: 'UTILITY',
    templateName: 'mediplan_cita_confirmada',
    body: 'Hola {{1}}, confirmamos tu cita en {{2}} para el {{3}} a las {{4}}. Si necesitas cambiarla, responde a este mensaje.',
    footer: 'Aviso de tu clínica',
    buttons: ['Confirmar', 'Reprogramar'],
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'clinic', label: 'Clínica', placeholder: 'Clínica Sonrisa' },
      { key: 'date', label: 'Fecha', placeholder: '15 de octubre' },
      { key: 'time', label: 'Hora', placeholder: '10:30' },
    ],
    examples: ['Ana García', 'Clínica Sonrisa', '15 de octubre', '10:30'],
  },
  {
    id: 'appointment_reminder',
    label: 'Recordatorio de cita',
    description: 'Para reducir inasistencias antes de la hora acordada.',
    category: 'UTILITY',
    templateName: 'mediplan_recordatorio_cita',
    body: 'Hola {{1}}, te recordamos tu cita en {{2}} el {{3}} a las {{4}}. Responde a este mensaje si no podrás asistir.',
    footer: 'Aviso de tu clínica',
    buttons: ['Confirmo', 'Reprogramar'],
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'clinic', label: 'Clínica', placeholder: 'Clínica Sonrisa' },
      { key: 'date', label: 'Fecha', placeholder: '15 de octubre' },
      { key: 'time', label: 'Hora', placeholder: '10:30' },
    ],
    examples: ['Ana García', 'Clínica Sonrisa', '15 de octubre', '10:30'],
  },
  {
    id: 'appointment_cancellation',
    label: 'Cancelación de cita',
    description: 'Cuando una cita se cancela y el paciente debe saberlo.',
    category: 'UTILITY',
    templateName: 'mediplan_cita_cancelada',
    body: 'Hola {{1}}, tu cita en {{2}} del {{3}} a las {{4}} fue cancelada. Escríbenos cuando quieras agendar una nueva fecha.',
    footer: 'Aviso de tu clínica',
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'clinic', label: 'Clínica', placeholder: 'Clínica Sonrisa' },
      { key: 'date', label: 'Fecha', placeholder: '15 de octubre' },
      { key: 'time', label: 'Hora', placeholder: '10:30' },
    ],
    examples: ['Ana García', 'Clínica Sonrisa', '15 de octubre', '10:30'],
  },
  {
    id: 'appointment_reschedule',
    label: 'Reprogramación',
    description: 'Cuando cambia el día o la hora de una cita.',
    category: 'UTILITY',
    templateName: 'mediplan_cita_reprogramada',
    body: 'Hola {{1}}, reprogramamos tu cita en {{2}} para el {{3}} a las {{4}}. Avísanos si este horario no te funciona.',
    footer: 'Aviso de tu clínica',
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'clinic', label: 'Clínica', placeholder: 'Clínica Sonrisa' },
      { key: 'date', label: 'Nueva fecha', placeholder: '16 de octubre' },
      { key: 'time', label: 'Nueva hora', placeholder: '12:00' },
    ],
    examples: ['Ana García', 'Clínica Sonrisa', '16 de octubre', '12:00'],
  },
  {
    id: 'closure',
    label: 'Aviso de cierre',
    description: 'Cierre por festivo, mantenimiento o emergencia.',
    category: 'UTILITY',
    templateName: 'mediplan_aviso_cierre',
    body: 'Hola {{1}}, te avisamos que {{2}} permanecerá cerrada el {{3}}. Motivo: {{4}}. Te contactaremos para reagendar si tienes cita.',
    footer: 'Aviso de tu clínica',
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'clinic', label: 'Clínica', placeholder: 'Clínica Sonrisa' },
      { key: 'date', label: 'Día de cierre', placeholder: '1 de noviembre' },
      { key: 'reason', label: 'Motivo', placeholder: 'día festivo' },
    ],
    examples: ['Ana García', 'Clínica Sonrisa', '1 de noviembre', 'día festivo'],
  },
  {
    id: 'follow_up',
    label: 'Seguimiento',
    description: 'Después de una visita, para saber cómo sigue el paciente.',
    category: 'UTILITY',
    templateName: 'mediplan_seguimiento',
    body: 'Hola {{1}}, esperamos que te encuentres bien después de tu visita a {{2}} el {{3}}. Si tienes molestias, responde a este mensaje.',
    footer: 'Aviso de tu clínica',
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'clinic', label: 'Clínica', placeholder: 'Clínica Sonrisa' },
      { key: 'date', label: 'Fecha de la visita', placeholder: '10 de octubre' },
    ],
    examples: ['Ana García', 'Clínica Sonrisa', '10 de octubre'],
  },
  {
    id: 'promotion',
    label: 'Promoción',
    description: 'Campañas. Solo a pacientes que aceptaron recibir promociones.',
    category: 'MARKETING',
    templateName: 'mediplan_promocion',
    body: 'Hola {{1}}, {{2}} tiene una promoción para ti: {{3}}. Está disponible hasta el {{4}}. Responde QUIERO si deseas agendar.',
    footer: 'Promoción de tu clínica',
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'clinic', label: 'Clínica', placeholder: 'Clínica Sonrisa' },
      { key: 'offer', label: 'Promoción', placeholder: 'valoración sin costo' },
      { key: 'until', label: 'Vigencia', placeholder: '31 de octubre' },
    ],
    examples: ['Ana García', 'Clínica Sonrisa', 'valoración sin costo', '31 de octubre'],
  },
  {
    id: 'discount',
    label: 'Descuento',
    description: 'Un descuento concreto. También exige consentimiento de marketing.',
    category: 'MARKETING',
    templateName: 'mediplan_descuento',
    body: 'Hola {{1}}, tienes un descuento de {{2}} en {{3}}, válido hasta el {{4}}. Escríbenos para usarlo en tu próxima cita.',
    footer: 'Promoción de tu clínica',
    variables: [
      { key: 'patient', label: 'Paciente', placeholder: 'Ana García' },
      { key: 'percent', label: 'Descuento', placeholder: '20%' },
      { key: 'service', label: 'Servicio', placeholder: 'limpieza dental' },
      { key: 'until', label: 'Vigencia', placeholder: '30 de octubre' },
    ],
    examples: ['Ana García', '20%', 'limpieza dental', '30 de octubre'],
  },
];

export function getNotice(id: NoticeKind): NoticeDefinition {
  const notice = NOTICE_CATALOG.find((item) => item.id === id);
  if (!notice) {
    throw new Error(`Aviso desconocido: ${id}`);
  }
  return notice;
}

export function createDefaultNotices(language = DEFAULT_TEMPLATE_LANGUAGE): NoticeSettings {
  return NOTICE_CATALOG.reduce<NoticeSettings>((settings, notice) => {
    const setting: NoticeSetting = {
      enabled: true,
      templateName: notice.templateName,
      language,
    };
    if (notice.id === 'appointment_reminder') {
      setting.hoursBefore = 24;
    }
    settings[notice.id] = setting;
    return settings;
  }, {} as NoticeSettings);
}

export function renderTemplateBody(body: string, values: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_match, index: string) => {
    const value = values[Number(index) - 1];
    return value?.trim() ? value.trim() : `{{${index}}}`;
  });
}
