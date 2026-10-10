import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { tweenBase } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

interface MeterProps {
  /** Valor actual (0–`max`). */
  value: number;
  max?: number;
  label: string;
  className?: string;
  barClassName?: string;
  /** Contenido opcional junto a la barra (porcentaje, leyenda…). */
  children?: ReactNode;
}

/**
 * Barra de progreso/métrica con `role="progressbar"` y relleno animado.
 * Se usa para tasas de conversión, ocupación y distribución de estados.
 */
function Meter({ value, max = 100, label, className, barClassName, children }: MeterProps) {
  const safeMax = max > 0 ? max : 100;
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Number(percent.toFixed(1))}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          className={cn('h-full rounded-full bg-primary', barClassName)}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={tweenBase}
        />
      </div>
      {children}
    </div>
  );
}

export { Meter, type MeterProps };
