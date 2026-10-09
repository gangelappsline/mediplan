import { motion } from 'motion/react';
import { Quote, Star } from 'lucide-react';

import { fadeUp, staggerContainer } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarClassName: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'Antes perdía horas coordinando citas por teléfono. Con MediPlan mi agenda se llena sola y mis pacientes confirman solos.',
    name: 'Dra. Laura Méndez',
    role: 'Odontóloga · Clínica Dental Sonrisa',
    initials: 'LM',
    avatarClassName: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
  },
  {
    quote:
      'Los recordatorios automáticos redujeron las ausencias casi a la mitad. El seguimiento post-consulta marca la diferencia.',
    name: 'Dr. Carlos Rivera',
    role: 'Médico general · Centro Médico Norte',
    initials: 'CR',
    avatarClassName: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  },
  {
    quote:
      'Las promociones por WhatsApp llenan mis horarios muertos. Nunca había tenido tanta ocupación en el centro de estética.',
    name: 'Valentina Ortiz',
    role: 'Esteticista · Studio Valentina',
    initials: 'VO',
    avatarClassName: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
  },
];

/** Testimonios de profesionales que ya usan MediPlan. */
function TestimonialsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="testimonios" className="scroll-mt-20 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeUp} className="text-sm font-semibold tracking-wide text-primary uppercase">
            Testimonios
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            Profesionales que ya transformaron su consulta
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Dentistas, doctores y esteticistas que recuperaron su tiempo con MediPlan.
          </motion.p>
        </motion.div>

        <motion.ul
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((testimonial) => (
            <motion.li key={testimonial.name} variants={fadeUp} className="h-full">
              <figure className="relative flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <Quote
                  aria-hidden="true"
                  className="absolute top-5 right-5 size-8 text-primary/15"
                />

                <div
                  aria-label="5 de 5 estrellas"
                  role="img"
                  className="flex items-center gap-0.5 text-amber-500"
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-4 fill-current" />
                  ))}
                </div>

                <blockquote className="mt-4 flex-1 leading-relaxed text-foreground">
                  “{testimonial.quote}”
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex size-11 items-center justify-center rounded-full text-sm font-semibold ${testimonial.avatarClassName}`}
                  >
                    {testimonial.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

export { TestimonialsSection };
