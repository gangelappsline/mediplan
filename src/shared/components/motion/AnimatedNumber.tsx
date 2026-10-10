import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

import { EASE_EMPHASIS } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { cn } from '@/shared/lib/utils';

interface AnimatedNumberProps {
  value: number;
  /** Decimales mostrados (por defecto 0). */
  decimals?: number;
  /** Duración del conteo en segundos. */
  duration?: number;
  /** Formateador propio (moneda, porcentajes…). Recibe el valor intermedio. */
  format?: (value: number) => string;
  className?: string;
  /** `true` para añadir signo `+` en valores positivos. */
  showSign?: boolean;
}

/**
 * Número con conteo animado. Se usa en las tarjetas KPI y en los nodos del
 * mapa de la plataforma para dar sensación de datos «vivos» sin recargar.
 * Con `prefers-reduced-motion` muestra el valor final de inmediato.
 */
function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.9,
  format,
  className,
  showSign = false,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const target = Number.isFinite(value) ? value : 0;
  const motionValue = useMotionValue(reduceMotion ? target : 0);
  const firstRun = useRef(true);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(target);
      return;
    }

    // En el primer render el conteo arranca en 0; después, desde el valor actual.
    if (firstRun.current && motionValue.get() === target) {
      firstRun.current = false;
      return;
    }
    firstRun.current = false;

    const controls = animate(motionValue, target, { duration, ease: EASE_EMPHASIS });
    return () => controls.stop();
  }, [target, duration, reduceMotion, motionValue]);

  const text = useTransform(motionValue, (latest) => {
    if (format) return format(latest);
    const rounded = latest.toLocaleString('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return showSign && target > 0 ? `+${rounded}` : rounded;
  });

  return <motion.span className={cn('tabular-nums', className)}>{text}</motion.span>;
}

export { AnimatedNumber, type AnimatedNumberProps };
