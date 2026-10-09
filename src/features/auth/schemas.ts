import { z } from 'zod';

/**
 * Esquemas Zod de autenticación (Standard Schema).
 *
 * Los esquemas de campo se reutilizan a nivel de campo en TanStack Form para
 * feedback inmediato; los esquemas de formulario validan el conjunto completo
 * al enviar y propagan los errores a cada campo.
 */

export const nameFieldSchema = z.string().min(2, 'Introduce tu nombre completo');

export const emailFieldSchema = z.email('Introduce un correo electrónico válido');

export const passwordFieldSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres');

export const confirmPasswordFieldSchema = z.string().min(1, 'Confirma tu contraseña');

export const professionalTypeFieldSchema = z.enum(
  ['dentist', 'doctor', 'nurse', 'esthetician', 'other'],
  'Selecciona tu tipo de profesional',
);

export const clinicNameFieldSchema = z.string().optional();

export const acceptTermsFieldSchema = z.boolean().refine((value) => value, {
  error: 'Debes aceptar los términos y condiciones',
});

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: passwordFieldSchema,
});

export const registerSchema = z
  .object({
    name: nameFieldSchema,
    email: emailFieldSchema,
    password: passwordFieldSchema,
    confirmPassword: confirmPasswordFieldSchema,
    professionalType: professionalTypeFieldSchema,
    clinicName: clinicNameFieldSchema,
    acceptTerms: acceptTermsFieldSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
