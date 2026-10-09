import { getFieldErrorMessages } from '@/shared/hooks/useAppForm';

interface FieldErrorsProps {
  /** Errores crudos de `field.state.meta.errors`. */
  errors: readonly unknown[];
  className?: string;
}

/** Mensajes de error accesibles (`role="alert"`) para un campo de formulario. */
function FieldErrors({ errors, className }: FieldErrorsProps) {
  const messages = getFieldErrorMessages(errors);

  if (messages.length === 0) {
    return null;
  }

  return (
    <p role="alert" className={className ?? 'text-sm font-medium text-destructive'}>
      {messages.join(' · ')}
    </p>
  );
}

export { FieldErrors };
