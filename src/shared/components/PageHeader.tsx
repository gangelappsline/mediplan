import { motion } from 'motion/react';
import type { ComponentType, ReactNode } from 'react';

import { fadeUp, listContainer } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Contenido adicional bajo el título (filtros, pestañas…). */
  children?: ReactNode;
  /** Texto corto encima del título (sección, entidad padre…). */
  eyebrow?: string;
  /** Icono destacado junto al título. */
  icon?: ComponentType<{ className?: string }>;
  /** Insignias o datos rápidos bajo la descripción. */
  meta?: ReactNode;
  className?: string;
}

/** Cabecera estándar de las páginas del panel: título, descripción y acciones. */
function PageHeader({ title, description, actions, children, eyebrow, icon: Icon, meta, className }: PageHeaderProps) {
  return (
    <motion.header
      className={cn('space-y-4', className)}
      variants={listContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <motion.div className="min-w-0 space-y-2" variants={fadeUp}>
          {eyebrow ? (
            <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>
          ) : null}
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:inline-flex">
                <Icon className="size-5" />
              </span>
            ) : null}
            <div className="min-w-0 space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h1>
              {description ? (
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
              ) : null}
            </div>
          </div>
          {meta ? <div className="flex flex-wrap items-center gap-2 pt-0.5">{meta}</div> : null}
        </motion.div>
        {actions ? (
          <motion.div className="flex flex-wrap items-center gap-2" variants={fadeUp}>
            {actions}
          </motion.div>
        ) : null}
      </div>
      {children ? <motion.div variants={fadeUp}>{children}</motion.div> : null}
    </motion.header>
  );
}

export { PageHeader, type PageHeaderProps };
