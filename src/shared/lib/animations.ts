import type { Transition, Variants } from 'motion/react';

/**
 * Curvas, muelles y variantes compartidas por toda la aplicación.
 *
 * Todas las animaciones se renderizan dentro de `<MotionConfig reducedMotion="user">`
 * (ver `src/app/providers.tsx`), de modo que Motion desactiva automáticamente
 * los desplazamientos y escalados cuando el usuario pide menos movimiento.
 */

/** Curva estándar de la aplicación (entrada y salida suaves). */
export const EASE_SOFT: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/** Curva con énfasis (material-style) para entradas rápidas. */
export const EASE_EMPHASIS: [number, number, number, number] = [0.2, 0, 0, 1];

/** Muelle suave: tarjetas, sidebar, indicadores de navegación. */
export const springSoft: Transition = { type: 'spring', stiffness: 320, damping: 30, mass: 0.9 };

/** Muelle corto y preciso: indicadores `layoutId`, thumbs, pills. */
export const springSnappy: Transition = { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 };

/** Muelle amplio: diálogos y paneles laterales. */
export const springGentle: Transition = { type: 'spring', stiffness: 260, damping: 28, mass: 1 };

export const tweenFast: Transition = { duration: 0.16, ease: EASE_SOFT };
export const tweenBase: Transition = { duration: 0.32, ease: EASE_SOFT };

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

/* --------------------------- Panel administrativo -------------------------- */

/** Stagger compacto para listas y tablas del panel. */
export const listContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
  exit: {
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

/** Elemento de lista/fila: sube y aparece. */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_SOFT } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE_SOFT } },
};

/** Transición entre rutas del panel. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_SOFT } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE_SOFT } },
};

/** Aparición de tarjetas y secciones al entrar en pantalla. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_SOFT } },
};

/** Entrada con rebote ligero (iconos, insignias, contadores). */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
};

/** Colapso/expansión de altura (sidebar plegable, acordeones). */
export const collapseVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.26, ease: EASE_EMPHASIS } },
};

/** Panel lateral (drawer) que entra desde la derecha. */
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: springGentle },
  exit: { x: '100%', transition: { duration: 0.22, ease: EASE_EMPHASIS } },
};

/** Contenido que se desvanece al cambiar de vista (tabla ↔ tarjetas). */
export const swapVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE_SOFT } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.14, ease: EASE_SOFT } },
};
