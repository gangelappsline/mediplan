import { motion } from 'motion/react';
import { BadgeDollarSign, CalendarClock, Target } from 'lucide-react';

import { LEAD_STATUS_LABEL, LEAD_STATUS_OPTIONS } from '@/features/business/labels';
import { Avatar } from '@/shared/components/Avatar';
import { EASE_SOFT } from '@/shared/lib/animations';
import { dayDiff, formatDate, formatMoney, formatRelativeDay } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { Lead, LeadStatusName } from '@/types';

interface LeadsBoardProps {
  leads: ReadonlyArray<Lead>;
  onOpenLead: (lead: Lead) => void;
}

const STAGE_TONE: Record<LeadStatusName, { bar: string; chip: string; dot: string }> = {
  new: { bar: 'bg-primary', chip: 'bg-primary/12 text-primary', dot: 'bg-primary' },
  contacted: { bar: 'bg-sky-500', chip: 'bg-sky-500/12 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  qualified: { bar: 'bg-violet-500', chip: 'bg-violet-500/12 text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  proposal: { bar: 'bg-amber-500', chip: 'bg-amber-500/12 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  won: { bar: 'bg-emerald-500', chip: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  lost: { bar: 'bg-rose-500', chip: 'bg-rose-500/12 text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

const FUNNEL_STAGES: ReadonlyArray<LeadStatusName> = ['new', 'contacted', 'qualified', 'proposal', 'won'];

function groupByStatus(leads: ReadonlyArray<Lead>): Record<string, Lead[]> {
  return leads.reduce<Record<string, Lead[]>>((groups, lead) => {
    const key = lead.status.name;
    groups[key] = [...(groups[key] ?? []), lead];
    return groups;
  }, {});
}

function sumValue(leads: ReadonlyArray<Lead>): number {
  return leads.reduce((total, lead) => total + (lead.estimated_value ?? 0), 0);
}

/**
 * Vista de tablero + embudo de los leads cargados en la página actual.
 * Agrupa por el estado que devuelve la API (solo lectura: el administrador
 * no modifica leads desde este panel).
 */
export function LeadsBoard({ leads, onOpenLead }: LeadsBoardProps) {
  const groups = groupByStatus(leads);
  const maxStage = Math.max(1, ...FUNNEL_STAGES.map((stage) => (groups[stage] ?? []).length));

  return (
    <div className="space-y-4">
      {/* Embudo de conversión de la página actual */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" />
            Embudo de la página actual
          </h2>
          <p className="text-xs text-muted-foreground">
            Valor estimado en pantalla: <span className="font-semibold text-foreground">{formatMoney(sumValue(leads))}</span>
          </p>
        </div>
        <div className="space-y-2">
          {FUNNEL_STAGES.map((stage, index) => {
            const stageLeads = groups[stage] ?? [];
            const tone = STAGE_TONE[stage];

            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                  {LEAD_STATUS_LABEL[stage]}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted/60">
                  <motion.div
                    className={cn('flex h-full items-center justify-end rounded-md pr-2', tone.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stageLeads.length > 0 ? 8 : 0, (stageLeads.length / maxStage) * 100)}%` }}
                    transition={{ duration: 0.6, ease: EASE_SOFT, delay: index * 0.07 }}
                  >
                    {stageLeads.length > 0 ? (
                      <span className="text-[11px] font-bold text-white tabular-nums">{stageLeads.length}</span>
                    ) : null}
                  </motion.div>
                </div>
                <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                  {formatMoney(sumValue(stageLeads))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columnas por estado */}
      <div className="scroll-area -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {LEAD_STATUS_OPTIONS.map((option, index) => {
          const stageLeads = groups[option.value] ?? [];
          const tone = STAGE_TONE[option.value];

          return (
            <motion.section
              key={option.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: EASE_SOFT, delay: index * 0.05 }}
              className="w-72 shrink-0 snap-start rounded-xl border border-border/60 bg-muted/30 p-2.5"
              aria-label={`Leads en estado ${option.label}`}
            >
              <header className="mb-2.5 flex items-center justify-between gap-2 px-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden className={cn('size-2 rounded-full', tone.dot)} />
                  {option.label}
                </h3>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums', tone.chip)}>
                  {stageLeads.length}
                </span>
              </header>

              {stageLeads.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                  Sin leads en esta etapa
                </p>
              ) : (
                <ul className="space-y-2">
                  {stageLeads.map((lead) => (
                    <li key={lead.id}>
                      <LeadCard lead={lead} onOpen={onOpenLead} />
                    </li>
                  ))}
                </ul>
              )}

              {stageLeads.length > 0 ? (
                <p className="mt-2.5 px-1 text-[11px] text-muted-foreground tabular-nums">
                  {formatMoney(sumValue(stageLeads))} estimados
                </p>
              ) : null}
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (lead: Lead) => void }) {
  const overdue = lead.follow_up_at ? dayDiff(lead.follow_up_at) < 0 && lead.status.name !== 'won' && lead.status.name !== 'lost' : false;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(lead)}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="w-full rounded-lg border border-border/60 bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={lead.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.company ?? `Negocio #${lead.business_id}`}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {lead.estimated_value !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <BadgeDollarSign className="size-3" />
            {formatMoney(lead.estimated_value)}
          </span>
        ) : null}
        {lead.source ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{lead.source}</span>
        ) : null}
      </div>

      {lead.follow_up_at ? (
        <p
          className={cn(
            'mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2 text-[11px]',
            overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground',
          )}
        >
          <CalendarClock className="size-3.5" />
          {formatRelativeDay(lead.follow_up_at)} · {formatDate(lead.follow_up_at)}
        </p>
      ) : null}
    </motion.button>
  );
}
