import { AnimatePresence, motion } from 'motion/react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { AuthShowcase } from '@/features/auth/components/AuthShowcase';
import { Logo } from '@/shared/components/Logo';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

/**
 * Layout de autenticación: diseño dividido — panel de marca con la propuesta de
 * valor (visible en pantallas grandes) y panel de formulario limpio con
 * transición animada entre login y registro.
 */
function AuthLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcase />

      <div className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        {/* Fondo sutil del panel de formulario */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-b from-background via-background to-primary/5"
        />
        <motion.div
          aria-hidden="true"
          className="absolute -top-20 -right-16 -z-10 size-72 rounded-full bg-primary/10 blur-3xl"
          animate={reduceMotion ? undefined : { y: [0, 18, 0], x: [0, -12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" aria-label="MediPlan — Ir al inicio">
              <Logo size="lg" />
            </Link>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} MediPlan · Software de gestión para clínicas y estéticas
          </p>
        </div>
      </div>
    </div>
  );
}

export { AuthLayout };
