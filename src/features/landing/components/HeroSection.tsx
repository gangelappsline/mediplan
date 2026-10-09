import { motion } from 'motion/react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AgendaMockup } from '@/features/landing/components/AgendaMockup';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { fadeUp, staggerContainer } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

const trustItems = ['Sin tarjeta de crédito', 'Listo en minutos', 'Cancela cuando quieras'] as const;

/** Hero de la landing con headline, CTAs y mockup de agenda animado. */
function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Decoración de fondo */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -z-10 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-40 -right-32 -z-10 size-96 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-16 pb-24 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Sparkles className="size-3.5 text-primary" />
              Todo-en-uno para salud y estética
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            MediPlan —{' '}
            <span className="bg-linear-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
              La agenda inteligente
            </span>{' '}
            para tu clínica
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Gestiona citas, da seguimiento a tus pacientes y envía promociones automáticas. Todo
            desde un solo lugar.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">
                Comenzar gratis
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2"
            aria-label="Ventajas de empezar"
          >
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <AgendaMockup />
      </div>
    </section>
  );
}

export { HeroSection };
