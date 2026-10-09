import { motion } from 'motion/react';
import {
  Activity,
  Bell,
  Calendar,
  ChartColumn,
  Clock,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

import { fadeUp, staggerContainer } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description:
      'Vista mensual, semanal y diaria con drag & drop y detección de conflictos.',
  },
  {
    icon: Activity,
    title: 'Seguimiento de Pacientes',
    description:
      'Historial de visitas, notas clínicas y recordatorios automáticos.',
  },
  {
    icon: Bell,
    title: 'Notificaciones y Promociones',
    description: 'Envío masivo de descuentos por WhatsApp, email o SMS.',
  },
  {
    icon: Stethoscope,
    title: 'Multi-especialidad',
    description: 'Dentistas, doctores, enfermeras, esteticistas y más.',
  },
  {
    icon: Clock,
    title: 'Recordatorios Automáticos',
    description:
      'Reduce ausencias hasta un 60% con confirmaciones automáticas.',
  },
  {
    // `ChartColumn` es el nombre actual en Lucide v1 del antiguo `BarChart3`.
    icon: ChartColumn,
    title: 'Reportes y Métricas',
    description: 'Ocupación, ingresos, retención y rendimiento del equipo.',
  },
];

/** Grid de funciones principales de MediPlan. */
function FeaturesSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="funciones" className="scroll-mt-20 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeUp} className="text-sm font-semibold tracking-wide text-primary uppercase">
            Funciones
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            Todo lo que tu clínica necesita, en un solo lugar
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Herramientas pensadas para profesionales de la salud y la estética que quieren
            recuperar tiempo y llenar su agenda.
          </motion.p>
        </motion.div>

        <motion.ul
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.li key={feature.title} variants={fadeUp}>
              <article className="group h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <feature.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{feature.description}</p>
              </article>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

export { FeaturesSection };
