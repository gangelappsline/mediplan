import { z } from 'zod';

/**
 * Esquemas Zod de autenticación (Standard Schema). Las reglas reflejan las
 * validaciones de `POST /login` y `POST /register` de la documentación.
 */

export const nameFieldSchema = z
  .string()
  .trim()
  .min(1, 'Introduce tu nombre completo')
  .max(255, 'El nombre no puede superar los 255 caracteres');

export const emailFieldSchema = z
  .email('Introduce un correo electrónico válido')
  .max(255, 'El correo no puede superar los 255 caracteres');

export const loginPasswordFieldSchema = z.string().min(1, 'Introduce tu contraseña');

export const passwordFieldSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres');

export const confirmPasswordFieldSchema = z.string().min(1, 'Confirma tu contraseña');

export const roleFieldSchema = z.enum(['cliente', 'negocio'], {
  error: 'Selecciona el tipo de cuenta',
});

export const acceptTermsFieldSchema = z.boolean().refine((value) => value, {
  error: 'Debes aceptar los términos y condiciones',
});

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: loginPasswordFieldSchema,
});

export const registerSchema = z
  .object({
    name: nameFieldSchema,
    email: emailFieldSchema,
    password: passwordFieldSchema,
    confirmPassword: confirmPasswordFieldSchema,
    role: roleFieldSchema,
    acceptTerms: acceptTermsFieldSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
