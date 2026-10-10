import { motion } from 'motion/react';
import type { ComponentType, ReactNode } from 'react';

import { popIn, springSoft } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Estado vacío con icono, mensaje y acción opcional. */
function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center',
        className,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSoft}
    >
      {Icon ? (
        <motion.span
          variants={popIn}
          initial="hidden"
          animate="visible"
          className="relative flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
        >
          <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-primary/5" />
          <Icon className="relative size-6" />
        </motion.span>
      ) : null}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </motion.div>
  );
}

export { EmptyState, type EmptyStateProps };
