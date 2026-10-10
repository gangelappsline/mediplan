import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

import { pageVariants } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  /** Clave que identifica la pantalla (normalmente `location.pathname`). */
  transitionKey: string;
  className?: string;
}

/**
 * Envoltorio de transición entre pantallas del panel: la página saliente se
 * desvanece y la entrante sube ligeramente. Requiere un `transitionKey`
 * distinto por ruta.
 */
function PageTransition({ children, transitionKey, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={transitionKey} variants={pageVariants} initial="initial" animate="enter" exit="exit" className={cn('h-full', className)}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export { PageTransition };
