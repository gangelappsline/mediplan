import type { Variants } from 'motion/react';

const EASE_SOFT: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/** Contenedor con efecto stagger para secciones de la landing. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

/** Entrada suave desde abajo (headline, cards, chips). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_SOFT },
  },
};

/** Fundido simple para elementos decorativos. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

/** Entrada con leve escala (mockups, badges). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_SOFT },
  },
};
