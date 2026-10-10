import { CircleAlert } from 'lucide-react';

import { ApiError, getErrorMessage } from '@/shared/api/http';
import { cn } from '@/shared/lib/utils';

interface ApiErrorAlertProps {
  error: unknown;
  className?: string;
  /** Mensaje si el error no trae texto útil. */
  fallback?: string;
}

/**
 * Muestra un error de la API: el mensaje principal y, en respuestas 422, la
 * lista de errores por campo para que el usuario sepa qué corregir.
 */
function ApiErrorAlert({ error, className, fallback }: ApiErrorAlertProps) {
  if (!error) return null;

  const messages = error instanceof ApiError ? error.validationMessages : [];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium text-destructive">{getErrorMessage(error, fallback)}</p>
        {messages.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
            {messages.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export { ApiErrorAlert };
