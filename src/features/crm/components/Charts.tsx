import { cn } from '@/shared/lib/utils';

/**
 * Gráficas CSS puras para reportes (sin dependencias): barras horizontales y
 * columnas verticales con proporciones calculadas sobre el máximo del dataset.
 */

export interface ChartDatum {
  label: string;
  value: number;
  /** Texto del extremo derecho (por defecto el valor numérico). */
  hint?: string;
  colorClass?: string;
}

interface HBarChartProps {
  data: ReadonlyArray<ChartDatum>;
  className?: string;
}

const defaultColor = 'bg-primary/70';

function HBarChart({ data, className }: HBarChartProps) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{item.hint ?? item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', item.colorClass ?? defaultColor)}
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface VBarChartProps {
  data: ReadonlyArray<ChartDatum>;
  className?: string;
}

function VBarChart({ data, className }: VBarChartProps) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className={cn('flex h-44 items-end gap-2', className)}>
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-medium tabular-nums">{item.hint ?? item.value}</span>
          <div className="flex h-full w-full items-end">
            <div
              className={cn(
                'w-full rounded-t-md transition-all',
                item.value === 0 ? 'bg-muted' : (item.colorClass ?? defaultColor),
              )}
              style={{ height: `${Math.max(4, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
          <span className="w-full truncate text-center text-xs text-muted-foreground">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export { HBarChart, VBarChart };
