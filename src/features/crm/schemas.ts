import { z } from 'zod';

/**
 * Esquemas Zod de los formularios del CRM (Standard Schema), alineados con el
 * patrón de `features/auth/schemas.ts`: esquemas de campo reutilizables +
 * esquema de formulario.
 */

export const clientNameFieldSchema = z.string().min(2, 'Introduce el nombre del cliente');

export const clientEmailFieldSchema = z.union([
  z.email('Introduce un correo electrónico válido'),
  z.literal(''),
]);

export const clientPhoneFieldSchema = z.string().max(30, 'Teléfono demasiado largo');

export const clientStatusFieldSchema = z.enum(
  ['lead', 'active', 'inactive', 'vip'],
  'Selecciona un estado',
);

export const clientSourceFieldSchema = z.enum(
  ['whatsapp', 'instagram', 'facebook', 'referido', 'web', 'llamada', 'otro'],
  'Selecciona un origen',
);

export const clientFormSchema = z
  .object({
    name: clientNameFieldSchema,
    email: clientEmailFieldSchema,
    phone: clientPhoneFieldSchema,
    status: clientStatusFieldSchema,
    source: clientSourceFieldSchema,
    tags: z.array(z.string()),
    company: z.string(),
    birthDate: z.string(),
    notes: z.string(),
  })
  .refine((data) => data.email !== '' || data.phone.trim() !== '', {
    error: 'Agrega al menos un correo o un teléfono de contacto',
    path: ['phone'],
  });

export type ClientFormValues = z.infer<typeof clientFormSchema>;

/* -------------------------------- Seguimientos ----------------------------- */

export const taskFormSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  title: z.string().min(3, 'Describe el seguimiento (mínimo 3 caracteres)'),
  type: z.enum(['call', 'whatsapp', 'email', 'visit', 'other'], 'Selecciona un tipo'),
  priority: z.enum(['low', 'medium', 'high'], 'Selecciona una prioridad'),
  dueAt: z.string().min(1, 'Indica la fecha límite'),
  notes: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/* ------------------------------ Oportunidades ------------------------------ */

export const dealFormSchema = z
  .object({
    clientId: z.string().min(1, 'Selecciona un cliente'),
    title: z.string().min(3, 'Describe la oportunidad (mínimo 3 caracteres)'),
    value: z.number().min(0, 'El valor no puede ser negativo'),
    stage: z.enum(['new', 'contacted', 'quoted', 'negotiation', 'won', 'lost'], 'Selecciona una etapa'),
    probability: z.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
    expectedCloseAt: z.string(),
    notes: z.string(),
  });

export type DealFormValues = z.infer<typeof dealFormSchema>;

/* ---------------------------------- Citas ---------------------------------- */

export const appointmentTitleFieldSchema = z
  .string()
  .min(3, 'Describe la cita (mínimo 3 caracteres)');

export const appointmentStartFieldSchema = z.string().min(1, 'Indica el inicio de la cita');

export const appointmentEndFieldSchema = z.string().min(1, 'Indica el fin de la cita');

export const appointmentStatusFieldSchema = z.enum(
  ['scheduled', 'confirmed', 'completed', 'cancelled'],
  'Selecciona un estado',
);

export const appointmentFormSchema = z
  .object({
    clientId: z.string().min(1, 'Selecciona un cliente'),
    title: appointmentTitleFieldSchema,
    startsAt: appointmentStartFieldSchema,
    endsAt: appointmentEndFieldSchema,
    status: appointmentStatusFieldSchema,
    notes: z.string(),
  })
  .refine((data) => new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime(), {
    error: 'El fin de la cita debe ser posterior al inicio',
    path: ['endsAt'],
  });

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

/* ------------------------------ Interacciones ------------------------------ */

export const activityKindFieldSchema = z.enum(
  ['note', 'call', 'whatsapp', 'email', 'visit'],
  'Selecciona un tipo',
);

export const activityTitleFieldSchema = z
  .string()
  .min(3, 'Resume la interacción (mínimo 3 caracteres)');

export const activityFormSchema = z.object({
  kind: activityKindFieldSchema,
  title: activityTitleFieldSchema,
  description: z.string(),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;
