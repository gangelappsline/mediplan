import { z } from 'zod';

export const accessTokenSchema = z
  .string()
  .trim()
  .min(20, 'Pega el token permanente del usuario del sistema')
  .refine((value) => !/\s/.test(value), 'El token no debe incluir espacios ni saltos de línea');

export const phoneNumberIdSchema = z
  .string()
  .trim()
  .regex(/^\d{8,20}$/, 'El Phone number ID es un identificador numérico, no el teléfono');

export const optionalDigitsSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{6,20}$/.test(value), 'Este identificador solo contiene dígitos');

export const connectSchema = z.object({
  accessToken: accessTokenSchema,
  phoneNumberId: phoneNumberIdSchema,
  wabaId: optionalDigitsSchema,
  appId: optionalDigitsSchema,
  appSecret: z.string().trim(),
});

export const embeddedConfigSchema = z.object({
  appId: z.string().trim().regex(/^\d{8,20}$/, 'El App ID es el número que aparece arriba en el panel de la app'),
  configId: z.string().trim().regex(/^\d{8,20}$/, 'El Configuration ID sale al crear Facebook Login for Business'),
  appSecret: z.string().trim().min(8, 'Pega el App Secret de Configuración → Básica'),
  solutionId: optionalDigitsSchema,
  pin: z.string().trim().refine((value) => value === '' || /^\d{6}$/.test(value), 'El PIN debe tener 6 dígitos'),
});

export const profileSchema = z.object({
  about: z.string().max(139, 'El estado admite máximo 139 caracteres'),
  address: z.string().max(256, 'La dirección admite máximo 256 caracteres'),
  description: z.string().max(512, 'La descripción admite máximo 512 caracteres'),
  email: z.string().trim().refine((value) => value === '' || z.email().safeParse(value).success, {
    error: 'Introduce un correo válido o déjalo vacío',
  }),
  website: z.string().trim().refine((value) => value === '' || /^https:\/\/\S+$/.test(value), {
    error: 'La web debe empezar por https://',
  }),
  vertical: z.enum(['HEALTH', 'BEAUTY', 'PROF_SERVICES', 'OTHER'], 'Elige el giro de la clínica'),
});

export const registerPinSchema = z.object({
  pin: z.string().trim().regex(/^\d{6}$/, 'El PIN de verificación en dos pasos tiene 6 dígitos'),
});

export type ConnectValues = z.infer<typeof connectSchema>;
export type EmbeddedConfigValues = z.infer<typeof embeddedConfigSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type RegisterPinValues = z.infer<typeof registerPinSchema>;
