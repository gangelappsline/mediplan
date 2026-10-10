import { z } from 'zod';

import type { AdminBusinessPayload, AdminUserPayload, RoleName } from '@/types';

/** Rol que acepta la API en `role` (español) → rol interno. */
export const ADMIN_ROLE_OPTIONS: ReadonlyArray<{ value: 'cliente' | 'negocio' | 'administrador'; label: string; name: RoleName }> = [
  { value: 'cliente', label: 'Cliente', name: 'client' },
  { value: 'negocio', label: 'Negocio', name: 'business' },
  { value: 'administrador', label: 'Administrador', name: 'admin' },
];

const optionalPhone = z.string().trim().max(30, 'Máximo 30 caracteres');

/* ------------------------------ Usuarios ------------------------------ */

export const adminUserCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
    email: z.email('Ingresa un correo válido').max(255, 'Máximo 255 caracteres'),
    phone: optionalPhone,
    role: z.enum(['cliente', 'negocio', 'administrador']),
    businessName: z.string().trim().max(255, 'Máximo 255 caracteres'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    passwordConfirmation: z.string(),
    isActive: z.boolean(),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmation'],
  });

export type AdminUserCreateValues = z.infer<typeof adminUserCreateSchema>;

export const adminUserEditSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
    email: z.email('Ingresa un correo válido').max(255, 'Máximo 255 caracteres'),
    phone: optionalPhone,
    /** Rol a añadir (vacío = no añadir). Para reemplazar roles usa la pantalla de roles. */
    addRole: z.enum(['', 'cliente', 'negocio', 'administrador']),
    businessName: z.string().trim().max(255, 'Máximo 255 caracteres'),
    password: z.string().refine((v) => v === '' || v.length >= 8, 'La contraseña debe tener al menos 8 caracteres'),
    passwordConfirmation: z.string(),
  })
  .refine((v) => v.password === '' || v.password === v.passwordConfirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmation'],
  });

export type AdminUserEditValues = z.infer<typeof adminUserEditSchema>;

export function toAdminUserCreatePayload(values: AdminUserCreateValues): AdminUserPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    role: values.role,
    business_name: values.role === 'negocio' && values.businessName.trim() ? values.businessName.trim() : null,
    password: values.password,
    password_confirmation: values.passwordConfirmation,
    is_active: values.isActive,
  };
}

export function toAdminUserEditPayload(values: AdminUserEditValues): AdminUserPayload {
  const payload: AdminUserPayload = {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
  };
  if (values.addRole) payload.role = values.addRole;
  if (values.addRole === 'negocio' && values.businessName.trim()) payload.business_name = values.businessName.trim();
  if (values.password) {
    payload.password = values.password;
    payload.password_confirmation = values.passwordConfirmation;
  }
  return payload;
}

/* ------------------------------ Negocios ------------------------------ */

export const adminBusinessSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Ingresa un correo válido'),
  phone: optionalPhone,
  address: z.string().trim().max(255, 'Máximo 255 caracteres'),
  city: z.string().trim().max(120, 'Máximo 120 caracteres'),
});

export type AdminBusinessValues = z.infer<typeof adminBusinessSchema>;

export function toAdminBusinessPayload(values: AdminBusinessValues): AdminBusinessPayload {
  const nullable = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    name: values.name.trim(),
    description: nullable(values.description),
    email: nullable(values.email),
    phone: nullable(values.phone),
    address: nullable(values.address),
    city: nullable(values.city),
  };
}
