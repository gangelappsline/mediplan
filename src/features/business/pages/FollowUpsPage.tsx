import { CalendarClock } from 'lucide-react';
import { useState } from 'react';

import { LeadTable } from '@/features/business/components/LeadTable';
import { useLeads } from '@/features/business/hooks';
import type { LeadListQuery } from '@/features/business/api';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { cn } from '@/shared/lib/utils';
import { dateValueAfter, shiftDateValue, todayDateValue } from '@/shared/lib/format';

type Preset = 'overdue' | 'today' | 'week' | 'open';

const PRESETS: ReadonlyArray<{ value: Preset; label: string }> = [
  { value: 'overdue', label: 'Vencidos' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Próximos 7 días' },
  { value: 'open', label: 'Todos los abiertos' },
];

/** Seguimientos: leads abiertos ordenados por fecha de seguimiento (`open=1`, `follow_up_from/to`). */
export function FollowUpsPage() {
  const [preset, setPreset] = useState<Preset>('today');
  const [page, setPage] = useState(1);

  const query: LeadListQuery = {
    open: 1,
    sort: 'follow_up_at',
    direction: 'asc',
    per_page: 15,
    page,
    ...presetRange(preset),
  };
  const leads = useLeads(query);

  return (
    <div className="space-y-6">
      <PageHeader title="Seguimientos" description="Los leads abiertos con un seguimiento programado.">
        <div className="inline-flex flex-wrap gap-1 rounded-lg border p-1">
          {PRESETS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={preset === item.value}
              onClick={() => {
                setPreset(item.value);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                preset === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <QueryBoundary
        isLoading={leads.isLoading}
        error={leads.error}
        onRetry={() => void leads.refetch()}
        isEmpty={leads.data?.data.length === 0}
        emptyState={
          <EmptyState icon={CalendarClock} title="No hay seguimientos en este periodo" description="Programa un seguimiento desde la ficha de un lead." />
        }
      >
        <div className="space-y-4">
          <LeadTable leads={leads.data?.data ?? []} showFollowUp />
          <Pagination meta={leads.data?.meta} onPageChange={setPage} />
        </div>
      </QueryBoundary>
    </div>
  );
}

/**
 * Rango de fechas (`YYYY-MM-DD`) para `follow_up_from` / `follow_up_to`.
 * "Vencidos" = seguimientos hasta ayer.
 */
function presetRange(preset: Preset): Pick<LeadListQuery, 'open' | 'follow_up_from' | 'follow_up_to'> {
  const today = todayDateValue();
  switch (preset) {
    case 'overdue':
      return { follow_up_to: shiftDateValue(today, -1) };
    case 'today':
      return { follow_up_from: today, follow_up_to: today };
    case 'week':
      return { follow_up_from: today, follow_up_to: dateValueAfter(7) };
    case 'open':
      return {};
  }
}
