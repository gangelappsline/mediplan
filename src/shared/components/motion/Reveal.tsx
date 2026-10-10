import { motion, type Variants } from 'motion/react';
import type { ElementType, ReactNode } from 'react';

import { EASE_SOFT, listContainer, listItem } from '@/shared/lib/animations';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Retardo en segundos. */
  delay?: number;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  /** Anima al entrar en pantalla (`view`) o al montarse (`mount`). */
  trigger?: 'view' | 'mount';
  as?: ElementType;
}

/** Contenedor que revela su contenido con un fundido + desplazamiento. */
function Reveal({ children, className, delay = 0, y = 18, trigger = 'view', as = 'div' }: RevealProps) {
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  const transition = { duration: 0.45, ease: EASE_SOFT, delay };

  if (trigger === 'mount') {
    return (
      <MotionTag className={className} initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={transition}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={transition}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  trigger?: 'view' | 'mount';
  as?: ElementType;
  /** Separación entre hijos en segundos. */
  stagger?: number;
}

/** Lista cuyos hijos entran en cascada (uno detrás de otro). */
function StaggerList({ children, className, trigger = 'mount', as = 'div', stagger = 0.045 }: StaggerListProps) {
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: 0.04 } },
  };

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      {...(trigger === 'mount' ? { animate: 'visible' } : { whileInView: 'visible', viewport: { once: true, margin: '-40px' } })}
    >
      {children}
    </MotionTag>
  );
}

/** Hijo de `StaggerList`. */
function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: ElementType }) {
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  return (
    <MotionTag className={className} variants={listItem as Variants}>
      {children}
    </MotionTag>
  );
}

/** Variante reutilizable para listas en cascada. */
export { listContainer };

export { Reveal, StaggerList, StaggerItem };
