import { Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { COMMON_FAILURES, EMBEDDED_SIGNUP_STEPS, GUIDE_STEPS, type GuideStep } from '@/features/whatsapp/instructions';
import { cn } from '@/shared/lib/utils';

const GUIDE_STORAGE_KEY = 'mediplan-whatsapp-guide-checks';

function readChecks(): string[] {
  try {
    const raw = window.localStorage.getItem(GUIDE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

interface SetupGuideProps {
  showEmbedded?: boolean;
  startOpen?: boolean;
}

function StepArticle({
  step,
  index,
  done,
  onToggle,
}: {
  step: GuideStep;
  index: number;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="relative grid grid-cols-[auto_1fr] gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
            done ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
          )}
        >
          {done ? <Check className="size-4" /> : index}
        </span>
        <span className="mt-2 w-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <div className="pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">{step.title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{step.minutes}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{step.summary}</p>
        <div className="mt-3 space-y-2 text-sm leading-relaxed">
          {step.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {step.warning ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            {step.warning}
          </p>
        ) : null}
        {step.links?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium text-primary hover:bg-accent"
              >
                {link.label}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        ) : null}
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-3.5 accent-[var(--color-primary)]"
            checked={done}
            onChange={onToggle}
          />
          Ya completé este paso
        </label>
      </div>
    </article>
  );
}

function SetupGuide({ showEmbedded = false, startOpen = true }: SetupGuideProps) {
  const [done, setDone] = useState<string[]>(() => readChecks());
  const [open, setOpen] = useState(startOpen);
  const steps = showEmbedded ? [...GUIDE_STEPS, ...EMBEDDED_SIGNUP_STEPS] : GUIDE_STEPS;

  function toggle(id: string) {
    setDone((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <section id="guia-meta" className="scroll-mt-24 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Instrucciones</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Cómo completar la sincronización en Meta</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {done.filter((id) => steps.some((step) => step.id === id)).length} de {steps.length} pasos marcados
          </p>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? 'Ocultar guía' : 'Ver guía'}
          </button>
        </div>
      </div>
      {open ? (
        <div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Estos pasos siguen el flujo actual de WhatsApp Cloud API y Embedded Signup v4. Los menús de Meta
            pueden aparecer en español o en inglés según tu cuenta; abajo van los dos nombres.
          </p>

          <div className="mt-6">
            {steps.map((step, index) => (
              <StepArticle
                key={step.id}
                step={step}
                index={index + 1}
                done={done.includes(step.id)}
                onToggle={() => {
                  toggle(step.id);
                }}
              />
            ))}
          </div>

          <div className="rounded-lg bg-muted/60 p-4">
            <h3 className="text-sm font-semibold">Si Meta responde con error</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {COMMON_FAILURES.map((failure) => (
                <li key={failure.title} className="text-sm">
                  <p className="font-medium">{failure.title}</p>
                  <p className="mt-1 text-muted-foreground">{failure.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Portafolio de Meta, número verificado, token permanente y Phone number ID. Abre la guía si Meta rechaza
          la sincronización.
        </p>
      )}
    </section>
  );
}

export { SetupGuide };
