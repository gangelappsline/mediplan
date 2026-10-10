import { Check, Sparkles, Star } from 'lucide-react';

import { LogoMark } from '@/shared/components/Logo';

const highlights = [
  {
    title: 'Agenda inteligente',
    description: 'Citas, controles y recordatorios en un solo lugar.',
  },
  {
    title: 'Seguimiento 360° de tus clientes',
    description: 'Historial, oportunidades y tareas de seguimiento.',
  },
  {
    title: 'Avisos por WhatsApp',
    description: 'Plantillas oficiales conectadas con la API de Meta.',
  },
  {
    title: 'Reportes claros',
    description: 'Conoce tu cartera, tu pipeline y tus ingresos.',
  },
] as const;

/**
 * Panel de marca del layout de autenticación: propuesta de valor, testimonio y
 * métricas sobre un fondo degradado. Solo visible en pantallas grandes.
 */
function AuthShowcase() {
  return (
    <aside
      aria-label="Beneficios de MediPlan"
      className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-950 via-cyan-900 to-teal-900 p-12 text-white lg:flex"
    >
      {/* Decoración: patrón de puntos + destellos */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-20 size-96 rounded-full bg-cyan-400/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -bottom-28 size-[28rem] rounded-full bg-teal-400/20 blur-3xl"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-2.5">
          <LogoMark className="size-10" />
          <span className="text-xl font-semibold tracking-tight">
            Medi<span className="text-teal-300">Plan</span>
          </span>
        </span>
      </div>

      <div className="relative max-w-md space-y-8">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-teal-100">
            <Sparkles className="size-3.5" />
            Software de gestión para clínicas y estéticas
          </span>
          <h2 className="text-4xl leading-tight font-bold tracking-tight">
            Tu clínica,
            <br />
            bajo control.
          </h2>
          <p className="text-teal-100/90">
            Organiza tus citas, da seguimiento a tus clientes y haz crecer tu negocio desde un
            solo panel.
          </p>
        </div>

        <ul className="space-y-3">
          {highlights.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-300/25 text-teal-200">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="block text-sm text-teal-100/80">{item.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative space-y-6">
        <figure className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div className="mb-2 flex gap-0.5 text-teal-300" aria-label="5 de 5 estrellas">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} className="size-3.5 fill-current" />
            ))}
          </div>
          <blockquote className="text-sm text-teal-50/95">
            “Pasamos de una agenda de papel a tener todo el historial de nuestros pacientes y
            recordatorios automáticos. El seguimiento de clientes ya no se nos escapa.”
          </blockquote>
          <figcaption className="mt-3 text-xs text-teal-200/90">
            Dra. Ana García · Clínica Dental Sonrisa
          </figcaption>
        </figure>

        <dl className="grid grid-cols-3 gap-4">
          {[
            { value: '+2,400', label: 'citas gestionadas / mes' },
            { value: '98%', label: 'recordatorios entregados' },
            { value: '4.9/5', label: 'satisfacción de usuarios' },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-bold tracking-tight">{stat.value}</dd>
              <dd className="text-xs text-teal-200/80">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

export { AuthShowcase };
