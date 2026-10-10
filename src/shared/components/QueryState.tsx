import { LoaderCircle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { ApiError, getErrorMessage } from '@/shared/api/http';
import { Button } from '@/shared/components/ui/button';

/** Indicador de carga centrado para listados y paneles. */
function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

/** Estado de error con reintento para consultas (GET). */
function ErrorState({ error, onRetry, title = 'No pudimos cargar esta información' }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      {onRetry && !(error instanceof ApiError && error.status === 401) ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

/** Contenedor que resuelve estados de carga, error y vacío de una consulta. */
function QueryBoundary({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyState,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty && emptyState) return <>{emptyState}</>;
  return <>{children}</>;
}

export { ErrorState, LoadingState, QueryBoundary };
