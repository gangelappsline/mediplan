import { cn } from '@/shared/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Bloque de carga con brillo deslizante (`.skeleton` en `index.css`). */
function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('skeleton rounded-md', className)} />;
}

/** Fila de esqueleto para tablas del panel. */
function TableRowSkeleton({ columns = 5, className }: { columns?: number; className?: string }) {
  return (
    <tr className={cn('border-b last:border-0', className)}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3.5">
          <Skeleton className={cn('h-4', index === 0 ? 'w-40' : 'w-20')} />
        </td>
      ))}
    </tr>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  /** Muestra el avatar circular en la primera columna. */
  withAvatars?: boolean;
}

/** Esqueleto completo de una tabla (cabecera + filas). */
function TableSkeleton({ rows = 6, columns = 5, withAvatars = true }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card" role="status" aria-label="Cargando datos">
      <div className="flex items-center gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className={cn('h-3', index === 0 ? 'w-28' : 'w-16')} />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
            {withAvatars ? <Skeleton className="size-8 shrink-0 rounded-full" /> : null}
            {Array.from({ length: columns - (withAvatars ? 1 : 0) }).map((__, columnIndex) => (
              <Skeleton key={columnIndex} className={cn('h-4', columnIndex === 0 ? 'w-44' : 'w-20')} />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Esqueleto de tarjeta KPI. */
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="size-10 rounded-xl" />
      </div>
    </div>
  );
}

/** Esqueleto de tarjeta de entidad (usuario/negocio) en vista de cuadrícula. */
function EntityCardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

/** Esqueleto de una ficha de detalle (cabecera + bloques). */
function DetailSkeleton({ blocks = 2 }: { blocks?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando detalle">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: blocks }).map((_, index) => (
          <div key={index} className={cn('space-y-4 rounded-xl border bg-card p-6', index === 0 && 'lg:col-span-2')}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Esqueleto de gráfica de barras. */
function ChartSkeleton({ bars = 4 }: { bars?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando gráfica">
      {Array.from({ length: bars }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Esqueleto del lienzo de nodos (React Flow). */
function FlowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-[420px] w-full overflow-hidden rounded-xl border bg-card', className)}>
      <div className="surface-dots absolute inset-0 opacity-60" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-8">
          <Skeleton className="h-24 w-40 rounded-xl" />
          <Skeleton className="h-24 w-40 rounded-xl" />
          <Skeleton className="h-24 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export {
  ChartSkeleton,
  DetailSkeleton,
  EntityCardSkeleton,
  FlowSkeleton,
  Skeleton,
  StatCardSkeleton,
  TableSkeleton,
  TableRowSkeleton,
};
