import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { fadeUp, staggerContainer } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { cn } from '@/shared/lib/utils';

type Billing = 'monthly' | 'yearly';

interface PricingTier {
  name: string;
  description: string;
  /** Precio mensual en USD, facturación mensual. */
  monthlyPrice: number;
  /** Precio mensual equivalente en USD, facturación anual (ahorro ~20%). */
  yearlyPrice: number;
  features: string[];
  featured?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Para profesionales independientes que empiezan a digitalizar su consulta.',
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: ['1 profesional', '50 citas/mes', 'Recordatorios básicos'],
  },
  {
    name: 'Professional',
    description: 'Para clínicas en crecimiento que necesitan escalar su operación.',
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      'Hasta 5 profesionales',
      'Citas ilimitadas',
      'Notificaciones masivas',
      'Reportes',
    ],
    featured: true,
  },
  {
    name: 'Clinic',
    description: 'Para clínicas y centros con varios equipos y sucursales.',
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      'Profesionales ilimitados',
      'Multi-sucursal',
      'API access',
      'Soporte prioritario',
    ],
  },
];

const billingLabels: Record<Billing, { action: string; note: string }> = {
  monthly: { action: 'mensual', note: 'Facturación mensual' },
  yearly: { action: 'anual', note: 'Facturación anual' },
};

/** Sección de precios con toggle mensual/anual y tres planes. */
function PricingSection() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const reduceMotion = useReducedMotion();

  return (
    <section id="precios" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeUp} className="text-sm font-semibold tracking-wide text-primary uppercase">
            Precios
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            Precios simples y transparentes
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Elige el plan que mejor se adapta a tu consulta. Cambia o cancela cuando quieras.
          </motion.p>

          {/* Toggle mensual / anual */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center gap-3">
            <div
              role="group"
              aria-label="Periodicidad de facturación"
              className="relative flex items-center rounded-full border bg-muted p-1"
            >
              {(['monthly', 'yearly'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setBilling(option);
                  }}
                  aria-pressed={billing === option}
                  className={cn(
                    'relative z-10 w-24 rounded-full px-5 py-2 text-sm font-medium transition-colors',
                    billing === option
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option === 'monthly' ? 'Mensual' : 'Anual'}
                </button>
              ))}
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-background shadow-sm"
                initial={false}
                animate={{
                  x: billing === 'monthly' ? 0 : '100%',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 32,
                  duration: reduceMotion ? 0 : undefined,
                }}
              />
            </div>
            <Badge variant="secondary" className="gap-1">
              <Check className="size-3 text-primary" />
              Ahorra hasta un 20% con la facturación anual
            </Badge>
          </motion.div>
        </motion.div>

        <motion.ul
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid items-stretch gap-6 lg:grid-cols-3"
        >
          {pricingTiers.map((tier) => (
            <motion.li key={tier.name} variants={fadeUp} className="h-full">
              <article
                className={cn(
                  'relative flex h-full flex-col rounded-2xl border bg-card p-8 shadow-sm transition-shadow',
                  tier.featured
                    ? 'border-primary/60 shadow-xl shadow-primary/10 ring-1 ring-primary/30'
                    : 'border-border/70 hover:shadow-lg',
                )}
              >
                {tier.featured ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Más popular</Badge>
                ) : null}

                <h3 className="text-lg font-semibold tracking-tight">{tier.name}</h3>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
                  {tier.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={`${tier.name}-${billing}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-4xl font-bold tracking-tight"
                    >
                      ${billing === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {billingLabels[billing].note}
                  {billing === 'yearly' ? ' · ahorras ~20%' : ''}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-3" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={tier.featured ? 'default' : 'outline'}
                  className="mt-8 w-full"
                >
                  <Link to="/register">
                    Comenzar con {tier.name}
                    <ArrowRight />
                  </Link>
                </Button>
              </article>
            </motion.li>
          ))}
        </motion.ul>

        <motion.p
          variants={fadeUp}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-10 text-center text-sm text-muted-foreground"
        >
          Precios en USD. Sin permanencia. Incluye soporte y actualizaciones.
        </motion.p>
      </div>
    </section>
  );
}

export { PricingSection };
