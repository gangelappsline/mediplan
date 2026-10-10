import { z } from 'zod';

import { fromDateTimeLocalValue } from '@/shared/lib/format';
import type {
  AppointmentPayload,
  AppointmentStatusPayload,
  BusinessProfilePayload,
  BusinessSettingsPayload,
  ClientPayload,
  ConvertLeadPayload,
  DayKey,
  LeadPayload,
  LeadStatusPayload,
  WorkingDay,
} from '@/types';
import { DAY_KEYS } from '@/features/business/labels';

/* ------------------------------ Helpers ------------------------------ */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DECIMAL_RE = /^\d+(\.\d{1,2})?$/;
const INTEGER_RE = /^\d+$/;

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Ingresa un correo válido');

const optionalDate = z
  .string()
  .refine((v) => v === '' || DATE_RE.test(v), 'Usa el formato de fecha AAAA-MM-DD');

const optionalDateTime = z
  .string()
  .refine((v) => v === '' || DATETIME_RE.test(v), 'Ingresa una fecha y hora válidas');

const optionalDecimal = z
  .string()
  .trim()
  .refine((v) => v === '' || DECIMAL_RE.test(v), 'Ingresa un monto válido (máximo 2 decimales)');

const optionalId = z
  .string()
  .trim()
  .refine((v) => v === '' || INTEGER_RE.test(v), 'Selecciona una opción válida');

const intRange = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .regex(INTEGER_RE, `${label} debe ser un número entero`)
    .refine((v) => {
      const n = Number(v);
      return n >= min && n <= max;
    }, `${label} debe estar entre ${min} y ${max}`);

/** Texto vacío → `null` para enviar campos nulables tal como la API los espera. */
const nullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const nullableNumber = (value: string): number | null => (value.trim() === '' ? null : Number(value));

/* ------------------------------ Clientes ------------------------------ */

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
  email: optionalEmail,
  phone: z.string().trim().max(30, 'Máximo 30 caracteres'),
  birthDate: optionalDate,
  notes: z.string().max(2000, 'Máximo 2000 caracteres'),
  status: z.enum(['active', 'inactive']),
  userId: optionalId,
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const emptyClientForm: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  notes: '',
  status: 'active',
  userId: '',
};

export function toClientPayload(values: ClientFormValues): ClientPayload {
  return {
    name: values.name.trim(),
    email: nullable(values.email),
    phone: nullable(values.phone),
    birth_date: nullable(values.birthDate),
    notes: nullable(values.notes),
    status: values.status,
    user_id: nullableNumber(values.userId),
  };
}

/* -------------------------------- Leads ------------------------------- */

export const leadFormSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
    email: optionalEmail,
    phone: z.string().trim().max(30, 'Máximo 30 caracteres'),
    company: z.string().trim().max(255, 'Máximo 255 caracteres'),
    source: z.string().trim().max(60, 'Máximo 60 caracteres'),
    status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
    estimatedValue: optionalDecimal,
    assignedToUserId: optionalId,
    followUpAt: optionalDateTime,
    notes: z.string().max(2000, 'Máximo 2000 caracteres'),
  })
  .refine((v) => v.email.trim() !== '' || v.phone.trim() !== '', {
    message: 'Ingresa al menos un correo o un teléfono',
    path: ['email'],
  });

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const emptyLeadForm: LeadFormValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: '',
  status: 'new',
  estimatedValue: '',
  assignedToUserId: '',
  followUpAt: '',
  notes: '',
};

export function toLeadPayload(values: LeadFormValues): LeadPayload {
  return {
    name: values.name.trim(),
    email: nullable(values.email),
    phone: nullable(values.phone),
    company: nullable(values.company),
    source: nullable(values.source),
    status: values.status,
    estimated_value: values.estimatedValue.trim() === '' ? null : Number(values.estimatedValue),
    assigned_to_user_id: nullableNumber(values.assignedToUserId),
    follow_up_at: values.followUpAt ? fromDateTimeLocalValue(values.followUpAt) : null,
    notes: nullable(values.notes),
  };
}

export const leadStatusFormSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
  followUpAt: optionalDateTime,
  notes: z.string().max(2000, 'Máximo 2000 caracteres'),
});

export type LeadStatusFormValues = z.infer<typeof leadStatusFormSchema>;

export function toLeadStatusPayload(values: LeadStatusFormValues): LeadStatusPayload {
  return {
    status: values.status,
    follow_up_at: values.followUpAt ? fromDateTimeLocalValue(values.followUpAt) : null,
    notes: nullable(values.notes),
  };
}

export const convertLeadFormSchema = z.object({
  name: z.string().trim().max(255, 'Máximo 255 caracteres'),
  email: optionalEmail,
  phone: z.string().trim().max(30, 'Máximo 30 caracteres'),
  notes: z.string().max(2000, 'Máximo 2000 caracteres'),
});

export type ConvertLeadFormValues = z.infer<typeof convertLeadFormSchema>;

/** Solo se envían los campos con contenido: la API usa el lead como respaldo para el resto. */
export function toConvertLeadPayload(values: ConvertLeadFormValues): ConvertLeadPayload {
  const payload: ConvertLeadPayload = {};
  const name = nullable(values.name);
  const email = nullable(values.email);
  const phone = nullable(values.phone);
  const notes = nullable(values.notes);
  if (name) payload.name = name;
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (notes) payload.notes = notes;
  return payload;
}

/* ----------------------------- Citas --------------------------------- */

export const appointmentFormSchema = z
  .object({
    clientId: z.string().min(1, 'Selecciona un cliente'),
    title: z.string().trim().min(1, 'El título es obligatorio').max(255, 'Máximo 255 caracteres'),
    description: z.string().max(2000, 'Máximo 2000 caracteres'),
    startsAt: z.string().refine((v) => DATETIME_RE.test(v), 'Ingresa la fecha y hora de inicio'),
    endsAt: z.string().refine((v) => DATETIME_RE.test(v), 'Ingresa la fecha y hora de fin'),
    status: z.enum(['scheduled', 'confirmed']),
    price: optionalDecimal,
  })
  .refine((v) => !DATETIME_RE.test(v.startsAt) || !DATETIME_RE.test(v.endsAt) || v.endsAt > v.startsAt, {
    message: 'La hora de fin debe ser posterior al inicio',
    path: ['endsAt'],
  });

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export function emptyAppointmentForm(clientId = '', startsAt = ''): AppointmentFormValues {
  return {
    clientId,
    title: '',
    description: '',
    startsAt,
    endsAt: '',
    status: 'scheduled',
    price: '',
  };
}

export function toAppointmentPayload(values: AppointmentFormValues): AppointmentPayload {
  return {
    client_id: Number(values.clientId),
    title: values.title.trim(),
    description: nullable(values.description),
    starts_at: fromDateTimeLocalValue(values.startsAt),
    ends_at: fromDateTimeLocalValue(values.endsAt),
    status: values.status,
    price: values.price.trim() === '' ? null : Number(values.price),
  };
}

export const appointmentStatusFormSchema = z
  .object({
    status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']),
    cancelReason: z.string().max(255, 'Máximo 255 caracteres'),
  })
  .refine((v) => v.status !== 'cancelled' || v.cancelReason.trim() !== '', {
    message: 'Indica el motivo de cancelación',
    path: ['cancelReason'],
  });

export type AppointmentStatusFormValues = z.infer<typeof appointmentStatusFormSchema>;

export function toAppointmentStatusPayload(values: AppointmentStatusFormValues): AppointmentStatusPayload {
  if (values.status === 'cancelled') {
    return { status: 'cancelled', cancel_reason: values.cancelReason.trim() };
  }
  return { status: values.status };
}

/* ---------------------------- Perfil --------------------------------- */

export const businessProfileFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres'),
  email: optionalEmail,
  phone: z.string().trim().max(30, 'Máximo 30 caracteres'),
  address: z.string().trim().max(255, 'Máximo 255 caracteres'),
  city: z.string().trim().max(120, 'Máximo 120 caracteres'),
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileFormSchema>;

export function toBusinessProfilePayload(values: BusinessProfileFormValues): BusinessProfilePayload {
  return {
    name: values.name.trim(),
    description: nullable(values.description),
    email: nullable(values.email),
    phone: nullable(values.phone),
    address: nullable(values.address),
    city: nullable(values.city),
  };
}

/* --------------------------- Configuración --------------------------- */

const workingDaySchema = z.object({
  open: z.string().refine((v) => TIME_RE.test(v), 'Hora inválida (HH:MM)'),
  close: z.string().refine((v) => TIME_RE.test(v), 'Hora inválida (HH:MM)'),
  closed: z.boolean(),
});

const workingHoursShape = Object.fromEntries(DAY_KEYS.map((day) => [day, workingDaySchema])) as Record<
  DayKey,
  typeof workingDaySchema
>;

export const businessSettingsFormSchema = z
  .object({
    timezone: z.string().min(1, 'Selecciona una zona horaria'),
    appointmentDurationMinutes: intRange(5, 480, 'La duración'),
    slotIntervalMinutes: intRange(5, 240, 'El intervalo'),
    minNoticeMinutes: intRange(0, 10080, 'El aviso mínimo'),
    maxAdvanceDays: intRange(1, 365, 'El máximo de días de anticipación'),
    autoConfirm: z.boolean(),
    allowOnlineBooking: z.boolean(),
    currency: z.string().regex(/^[A-Z]{3}$/, 'Usa un código de 3 letras (p. ej. MXN)'),
    workingHours: z.object(workingHoursShape),
  })
  .superRefine((values, ctx) => {
    for (const day of DAY_KEYS) {
      const hours = values.workingHours[day];
      if (!hours.closed && hours.open >= hours.close) {
        ctx.addIssue({
          code: 'custom',
          message: 'La hora de cierre debe ser posterior a la de apertura',
          path: ['workingHours', day, 'close'],
        });
      }
    }
  });

export type BusinessSettingsFormValues = z.infer<typeof businessSettingsFormSchema>;

export function toBusinessSettingsPayload(values: BusinessSettingsFormValues): BusinessSettingsPayload {
  const working_hours = Object.fromEntries(
    DAY_KEYS.map((day) => {
      const hours: WorkingDay = {
        open: values.workingHours[day].open,
        close: values.workingHours[day].close,
        closed: values.workingHours[day].closed,
      };
      return [day, hours];
    }),
  ) as Record<DayKey, WorkingDay>;

  return {
    timezone: values.timezone,
    appointment_duration_minutes: Number(values.appointmentDurationMinutes),
    slot_interval_minutes: Number(values.slotIntervalMinutes),
    min_notice_minutes: Number(values.minNoticeMinutes),
    max_advance_days: Number(values.maxAdvanceDays),
    auto_confirm_appointments: values.autoConfirm,
    allow_online_booking: values.allowOnlineBooking,
    currency: values.currency,
    working_hours,
  };
}
