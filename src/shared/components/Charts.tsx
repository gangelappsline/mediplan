import { motion } from 'motion/react';

import { EASE_SOFT } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

/** Gráficas CSS/SVG puras (sin dependencias) con entrada animada. */

export interface ChartDatum {
  label: string;
  value: number;
  /** Texto del extremo (por defecto, el valor numérico). */
  hint?: string;
  colorClass?: string;
}

const defaultColor = 'bg-primary/70';

function HBarChart({ data, className }: { data: ReadonlyArray<ChartDatum>; className?: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item, index) => (
        <div key={item.label} className="group/bar space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground transition-colors group-hover/bar:text-foreground">
              {item.label}
            </span>
            <span className="font-medium tabular-nums">{item.hint ?? item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn('h-full rounded-full', item.colorClass ?? defaultColor)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, Math.round((item.value / max) * 100))}%` }}
              transition={{ duration: 0.6, ease: EASE_SOFT, delay: index * 0.06 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VBarChart({ data, className }: { data: ReadonlyArray<ChartDatum>; className?: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className={cn('flex h-44 items-end gap-2', className)}>
      {data.map((item, index) => (
        <div key={item.label} className="group/bar flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-medium tabular-nums">{item.hint ?? item.value}</span>
          <div className="flex h-full w-full items-end">
            <motion.div
              className={cn(
                'w-full rounded-t-md transition-colors group-hover/bar:brightness-110',
                item.value === 0 ? 'bg-muted' : (item.colorClass ?? defaultColor),
              )}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, Math.round((item.value / max) * 100))}%` }}
              transition={{ duration: 0.55, ease: EASE_SOFT, delay: index * 0.05 }}
            />
          </div>
          <span className="w-full truncate text-center text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Donut ---------------------------------- */

const DONUT_PALETTE: ReadonlyArray<{ stroke: string; dot: string }> = [
  { stroke: 'stroke-primary', dot: 'bg-primary' },
  { stroke: 'stroke-sky-500', dot: 'bg-sky-500' },
  { stroke: 'stroke-violet-500', dot: 'bg-violet-500' },
  { stroke: 'stroke-amber-500', dot: 'bg-amber-500' },
  { stroke: 'stroke-emerald-500', dot: 'bg-emerald-500' },
  { stroke: 'stroke-rose-500', dot: 'bg-rose-500' },
];

export interface DonutDatum extends ChartDatum {
  /** Clase `stroke-*` propia (opcional; si no, se toma de la paleta). */
  strokeClass?: string;
}

interface DonutChartProps {
  data: ReadonlyArray<DonutDatum>;
  size?: number;
  thickness?: number;
  /** Contenido en el centro del aro (valor grande + etiqueta). */
  center?: React.ReactNode;
  /** Muestra la leyenda con porcentajes a la derecha. */
  showLegend?: boolean;
  className?: string;
}

/** Aro de progreso multiserie (distribución por rol, estado, etapa…). */
function DonutChart({ data, size = 148, thickness = 16, center, showLegend = true, className }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center2 = size / 2;

  let accumulated = 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-6', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            cx={center2}
            cy={center2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            className="stroke-muted"
          />
          {total > 0
            ? data.map((item, index) => {
                const fraction = item.value / total;
                const dash = Math.max(0, fraction * circumference - (data.length > 1 ? 2 : 0));
                const rotation = (accumulated / total) * 360 - 90;
                accumulated += item.value;

                if (item.value === 0) return null;

                return (
                  <motion.circle
                    key={item.label}
                    cx={center2}
                    cy={center2}
                    r={radius}
                    fill="none"
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    className={item.strokeClass ?? DONUT_PALETTE[index % DONUT_PALETTE.length].stroke}
                    transform={`rotate(${rotation} ${center2} ${center2})`}
                    initial={{ strokeDasharray: `0 ${circumference}`, opacity: 0 }}
                    animate={{ strokeDasharray: `${dash} ${circumference - dash}`, opacity: 1 }}
                    transition={{ duration: 0.7, ease: EASE_SOFT, delay: index * 0.08 }}
                  />
                );
              })
            : null}
        </svg>
        {center ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
        ) : null}
      </div>

      {showLegend ? (
        <ul className="min-w-0 flex-1 space-y-2">
          {data.map((item, index) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <li key={item.label} className="flex items-center gap-2.5 text-sm">
                <span
                  aria-hidden="true"
                  className={cn('size-2.5 shrink-0 rounded-full', DONUT_PALETTE[index % DONUT_PALETTE.length].dot)}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{item.hint ?? item.value}</span>
                <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{percent}%</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export { DonutChart, HBarChart, VBarChart, DONUT_PALETTE };
