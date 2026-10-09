import { AnimatePresence, motion } from 'motion/react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { Logo } from '@/shared/components/Logo';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

/**
 * Layout de autenticación: página centrada con fondo en gradiente suave,
 * card con sombra, logo arriba y transición animada entre login y registro.
 */
function AuthLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Fondo con gradiente sutil + destellos decorativos */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-linear-to-br from-primary/10 via-background to-accent/25"
      />
      <motion.div
        aria-hidden="true"
        className="absolute -top-24 -left-24 -z-10 size-96 rounded-full bg-primary/15 blur-3xl"
        animate={reduceMotion ? undefined : { y: [0, 24, 0], x: [0, 16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-24 -bottom-24 -z-10 size-96 rounded-full bg-cyan-500/15 blur-3xl"
        animate={reduceMotion ? undefined : { y: [0, -20, 0], x: [0, -14, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="w-full max-w-md">
        <Card className="border-border/60 shadow-xl">
          <CardContent className="pt-6">
            <div className="mb-6 flex justify-center">
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
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MediPlan · Software de gestión para clínicas y estéticas
        </p>
      </div>
    </div>
  );
}

export { AuthLayout };
