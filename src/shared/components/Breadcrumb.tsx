import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { tweenFast } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

export interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: ReadonlyArray<Crumb>;
  className?: string;
}

/**
 * Migas de pan del panel. Se animan al cambiar de ruta para reforzar la
 * sensación de profundidad (listado → detalle → edición).
 */
function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Ruta actual" className={cn('flex min-w-0 items-center gap-1 text-sm', className)}>
      <AnimatePresence initial={false}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <motion.span
              key={`${item.label}-${item.to ?? index}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={tweenFast}
              className="flex min-w-0 items-center gap-1"
            >
              {index > 0 ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden /> : null}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={cn('truncate', isLast ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              )}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </nav>
  );
}

export { Breadcrumb };
