import { CalendarClock, Maximize2 } from 'lucide-react';

import { LEAD_STATUS_LABEL } from '@/features/business/labels';
import { Avatar } from '@/shared/components/Avatar';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { dayDiff, formatDate, formatMoney, formatRelativeDay } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { Lead, LeadStatusName } from '@/types';

interface LeadsTableProps {
  leads: ReadonlyArray<Lead>;
  onOpenLead: (lead: Lead) => void;
}

const headClass = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase';

/** Tabla de leads de la plataforma; cada fila abre el panel lateral de detalle. */
export function LeadsTable({ leads, onOpenLead }: LeadsTableProps) {
  return (
    <div className="scroll-area overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <caption className="sr-only">Leads de todos los negocios con su estado, valor y seguimiento</caption>
        <thead className="border-b border-border/60 bg-muted/40">
          <tr>
            <th scope="col" className={headClass}>Lead</th>
            <th scope="col" className={`${headClass} hidden md:table-cell`}>Negocio</th>
            <th scope="col" className={headClass}>Estado</th>
            <th scope="col" className={`${headClass} hidden sm:table-cell`}>Valor</th>
            <th scope="col" className={`${headClass} hidden lg:table-cell`}>Seguimiento</th>
            <th scope="col" className={`${headClass} hidden lg:table-cell`}>Alta</th>
            <th scope="col" className={`${headClass} text-right`}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <StaggerList as="tbody" className="divide-y divide-border/60">
          {leads.map((lead) => {
            const overdue = lead.follow_up_at ? dayDiff(lead.follow_up_at) < 0 && isOpen(lead.status.name) : false;

            return (
              <StaggerItem
                as="tr"
                key={lead.id}
                className="group/row cursor-pointer transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenLead(lead)}
                    className="flex items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <Avatar name={lead.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block max-w-[15rem] truncate font-medium group-hover/row:text-primary">{lead.name}</span>
                      <span className="block max-w-[15rem] truncate text-xs text-muted-foreground">
                        {lead.email ?? lead.phone ?? 'Sin contacto'}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="hidden max-w-[13rem] truncate px-4 py-3 text-muted-foreground md:table-cell">
                  {lead.company ?? `Negocio #${lead.business_id}`}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge name={lead.status.name} label={leadLabel(lead)} />
                </td>
                <td className="hidden px-4 py-3 font-medium tabular-nums sm:table-cell">
                  {lead.estimated_value !== null ? formatMoney(lead.estimated_value) : '—'}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {lead.follow_up_at ? (
                    <Tooltip content={formatDate(lead.follow_up_at)}>
                      <span
                        className={cn(
                          'inline-flex cursor-default items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                          overdue
                            ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <CalendarClock className="size-3.5" />
                        {formatRelativeDay(lead.follow_up_at)}
                      </span>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {lead.created_at ? formatDate(lead.created_at) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip content="Abrir detalle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Abrir detalle de ${lead.name}`}
                        onClick={() => onOpenLead(lead)}
                      >
                        <Maximize2 />
                      </Button>
                    </Tooltip>
                  </div>
                </td>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </table>
    </div>
  );
}

function isOpen(status: string): boolean {
  return status !== 'won' && status !== 'lost';
}

function leadLabel(lead: Lead): string {
  return LEAD_STATUS_LABEL[lead.status.name as LeadStatusName] ?? lead.status.label;
}
