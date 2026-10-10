import { motion } from 'motion/react';
import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AnimatedNumber } from '@/shared/components/motion/AnimatedNumber';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { springSoft, tweenFast } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

const tones = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
} as const;

interface StatCardProps {
  title: string;
  /** Número (se anima con conteo) o contenido propio. */
  value: ReactNode;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: keyof typeof tones;
  href?: string;
  /** Texto del tooltip al pasar el cursor. */
  tooltip?: string;
  /** Contenido extra en el pie (tendencias, medidores). */
  footer?: ReactNode;
  /** Muestra el esqueleto de carga en lugar del contenido. */
  loading?: boolean;
  /** Decimales del conteo cuando `value` es numérico. */
  decimals?: number;
  className?: string;
}

/** Tarjeta KPI compacta para resúmenes y reportes. */
function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  href,
  tooltip,
  footer,
  loading = false,
  decimals = 0,
  className,
}: StatCardProps) {
  const card = (
    <motion.div
      whileHover={href ? { y: -3 } : undefined}
      whileTap={href ? { scale: 0.99 } : undefined}
      transition={springSoft}
      className="h-full"
    >
      <div
        className={cn(
          'relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border/60 bg-card py-5 shadow-sm',
          'transition-colors duration-300',
          href && 'group-hover:border-primary/40 group-hover:shadow-md',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-16 -right-10 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500',
            href && 'group-hover:opacity-100',
            tone === 'primary' && 'bg-primary/20',
            tone === 'success' && 'bg-emerald-500/20',
            tone === 'warn' && 'bg-amber-500/20',
            tone === 'danger' && 'bg-rose-500/20',
            tone === 'info' && 'bg-sky-500/20',
            tone === 'violet' && 'bg-violet-500/20',
            tone === 'default' && 'bg-muted-foreground/10',
          )}
        />
        <div className="relative flex items-start justify-between gap-3 px-5">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl leading-none font-bold tracking-tight">
                {typeof value === 'number' ? (
                  <AnimatedNumber value={value} decimals={decimals} />
                ) : (
                  value
                )}
              </p>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={tweenFast}
            className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}
          >
            <Icon className="size-5" />
          </motion.div>
        </div>
        {loading ? (
          <div className="relative space-y-3 px-5">
            <Skeleton className="h-3 w-full" />
          </div>
        ) : (
          <div className="relative mt-auto space-y-2 px-5">
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  );

  const content = href ? (
    <Link
      to={href}
      className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <div className="h-full">{content}</div>
      </Tooltip>
    );
  }

  return content;
}

export { StatCard, type StatCardProps };
