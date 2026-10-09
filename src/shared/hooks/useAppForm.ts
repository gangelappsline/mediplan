import { useForm, type StandardSchemaV1 } from '@tanstack/react-form';

/**
 * Errores de validación que llegan a `field.state.meta.errors`:
 * - `string` para validadores funcionales.
 * - `StandardSchemaV1Issue[]` para esquemas Zod (Standard Schema).
 */
type FieldError = string | { message: string } | ReadonlyArray<{ message: string }>;

/** Normaliza los errores de un campo a mensajes legibles. */
export function getFieldErrorMessages(errors: readonly unknown[]): string[] {
  const messages: string[] = [];

  for (const error of errors as readonly FieldError[]) {
    if (typeof error === 'string') {
      if (error) messages.push(error);
    } else if (Array.isArray(error)) {
      for (const issue of error) {
        if (issue?.message) messages.push(issue.message);
      }
    } else if (error && typeof error === 'object' && 'message' in error && error.message) {
      messages.push(error.message);
    }
  }

  return messages;
}

export interface UseAppFormOptions<TValues extends object> {
  /**
   * Esquema Zod del formulario completo (Standard Schema). Se ejecuta al
   * enviar y sus errores se propagan automáticamente a cada campo.
   */
  schema: StandardSchemaV1<TValues, unknown>;
  defaultValues: TValues;
  onSubmit: (values: TValues) => void | Promise<void>;
}

/**
 * Hook de formulario de MediPlan: envuelve `useForm` de TanStack Form con los
 * defaults compartidos de la app (validación Zod al submit, manejo uniforme
 * del envío). Es el único punto de entrada para crear formularios, de modo que
 * todos comparten el mismo contexto de validación y envío.
 */
export function useAppForm<TValues extends object>({
  schema,
  defaultValues,
  onSubmit,
}: UseAppFormOptions<TValues>) {
  return useForm({
    defaultValues,
    validators: {
      onSubmitAsync: schema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}
