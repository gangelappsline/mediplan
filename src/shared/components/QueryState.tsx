import { CircleAlert, LoaderCircle, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

import { ApiError, getErrorMessage } from '@/shared/api/http';
import { popIn, springSoft } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

interface LoadingStateProps {
  label?: string;
  /** Esqueleto que sustituye al spinner (recomendado en listados). */
  skeleton?: ReactNode;
}

/** Indicador de carga centrado (o esqueleto) para listados y paneles. */
function LoadingState({ label = 'Cargando…', skeleton }: LoadingStateProps) {
  if (skeleton) {
    return (
      <div role="status" aria-busy="true" aria-label={label}>
        {skeleton}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </motion.div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

/** Estado de error con reintento para consultas (GET). */
function ErrorState({ error, onRetry, title = 'No pudimos cargar esta información' }: ErrorStateProps) {
  const status = error instanceof ApiError ? error.status : undefined;

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSoft}
    >
      <motion.span
        variants={popIn}
        initial="hidden"
        animate="visible"
        className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
      >
        <CircleAlert className="size-6" />
      </motion.span>
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {getErrorMessage(error)}
        {status ? <span className="ml-1 text-xs">({status})</span> : null}
      </p>
      {onRetry && status !== 401 ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw />
          Reintentar
        </Button>
      ) : null}
    </motion.div>
  );
}

interface QueryBoundaryProps {
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  children: ReactNode;
  /** Esqueleto mostrado durante la primera carga. */
  skeleton?: ReactNode;
  /** Refresco en segundo plano: muestra una barra de progreso superior. */
  isFetching?: boolean;
  className?: string;
}

/** Contenedor que resuelve estados de carga, error y vacío de una consulta. */
function QueryBoundary({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyState,
  children,
  skeleton,
  isFetching = false,
  className,
}: QueryBoundaryProps) {
  if (isLoading) return <LoadingState skeleton={skeleton} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty && emptyState) return <>{emptyState}</>;

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {isFetching ? (
          <motion.div
            key="refetch-bar"
            aria-hidden="true"
            className="absolute inset-x-0 -top-2 z-20 h-0.5 overflow-hidden rounded-full bg-primary/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-primary"
              animate={{ x: ['-110%', '320%'] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.div animate={{ opacity: isFetching ? 0.6 : 1 }} transition={{ duration: 0.2 }}>
        {children}
      </motion.div>
    </div>
  );
}

export { ErrorState, LoadingState, QueryBoundary };
