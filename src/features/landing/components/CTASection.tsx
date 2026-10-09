import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import { fadeUp, staggerContainer } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

/** Llamada a la acción final de la landing. */
function CTASection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-teal-600 to-cyan-700 px-6 py-16 text-center shadow-2xl shadow-primary/25 sm:px-12 sm:py-20"
        >
          {/* Decoración */}
          <div
            aria-hidden="true"
            className="absolute -top-16 -left-16 size-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 -bottom-16 size-72 rounded-full bg-white/10 blur-2xl"
          />

          <motion.h2
            variants={fadeUp}
            className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl"
          >
            ¿Listo para transformar tu consulta?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/85"
          >
            Crea tu cuenta gratis y configura tu primera agenda en minutos. Sin tarjeta de crédito.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary shadow-lg hover:bg-white/90 hover:text-primary"
            >
              <Link to="/register">
                Crear cuenta gratis
                <ArrowRight />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export { CTASection };
