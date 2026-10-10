import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { listItem } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

export interface InfoRowProps {
  label: string;
  value?: ReactNode;
  icon?: LucideIcon;
  /** Texto secundario bajo el valor (relativo, aclaración…). */
  hint?: ReactNode;
  /** Convierte el valor en un enlace interno. */
  to?: string;
  /** Texto cuando no hay valor. */
  empty?: string;
  tone?: 'default' | 'muted' | 'success' | 'danger';
}

/** Fila de definición (etiqueta + valor) para las fichas de detalle. */
function InfoRow({ label, value, icon: Icon, hint, to, empty = '—', tone = 'default' }: InfoRowProps) {
  const isEmpty = value === null || value === undefined || value === '';

  const content = (
    <span
      className={cn(
        'min-w-0 text-right text-sm font-medium break-words',
        isEmpty && 'font-normal text-muted-foreground',
        tone === 'muted' && 'text-muted-foreground',
        tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'danger' && 'text-rose-600 dark:text-rose-400',
      )}
    >
      {isEmpty ? empty : value}
      {hint && !isEmpty ? <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </span>
  );

  return (
    <motion.div
      variants={listItem}
      className="flex items-start justify-between gap-4 border-b border-border/50 py-2.5 last:border-0"
    >
      <span className="flex shrink-0 items-center gap-2 pt-0.5 text-sm text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </span>
      {to && !isEmpty ? (
        <Link to={to} className="min-w-0 text-right transition-colors hover:text-primary hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}

/** Lista de filas de definición con entrada en cascada. */
function InfoList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-0', className)}>{children}</div>;
}

export { InfoList, InfoRow };
