import { Plus, Search, Target } from 'lucide-react';
import { useState } from 'react';

import { LeadTable } from '@/features/business/components/LeadTable';
import { useLeads } from '@/features/business/hooks';
import { LEAD_STATUS_OPTIONS } from '@/features/business/labels';
import type { LeadListQuery } from '@/features/business/api';
import { LinkButton } from '@/shared/components/LinkButton';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const ALL = 'all';

type SortValue = 'created_at:desc' | 'created_at:asc' | 'name:asc' | 'estimated_value:desc' | 'follow_up_at:asc';

const SORT_OPTIONS: ReadonlyArray<{ value: SortValue; label: string }> = [
  { value: 'created_at:desc', label: 'Más recientes' },
  { value: 'created_at:asc', label: 'Más antiguos' },
  { value: 'name:asc', label: 'Nombre (A–Z)' },
  { value: 'estimated_value:desc', label: 'Mayor valor' },
  { value: 'follow_up_at:asc', label: 'Próximo seguimiento' },
];

/** Pipeline de leads: `GET /business/leads` con búsqueda, estado y orden. */
export function PipelinePage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<string>(ALL);
  const [sort, setSort] = useState<SortValue>('created_at:desc');
  const [page, setPage] = useState(1);

  const [sortField, direction] = sort.split(':') as [NonNullable<LeadListQuery['sort']>, 'asc' | 'desc'];
  const query: LeadListQuery = {
    search: debounced || undefined,
    status: status === ALL ? '' : (status as LeadListQuery['status']),
    sort: sortField,
    direction,
    page,
    per_page: 15,
  };
  const leads = useLeads(query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Sigue cada oportunidad desde el primer contacto hasta el cierre."
        actions={<LinkButton to="/dashboard/pipeline/nuevo"><Plus />Nuevo lead</LinkButton>}
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, empresa o contacto"
              aria-label="Buscar leads"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
            <SelectTrigger aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {LEAD_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => { setSort(value as SortValue); setPage(1); }}>
            <SelectTrigger aria-label="Ordenar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <QueryBoundary
        isLoading={leads.isLoading}
        error={leads.error}
        onRetry={() => void leads.refetch()}
        isEmpty={leads.data?.data.length === 0}
        emptyState={
          <EmptyState
            icon={Target}
            title="Aún no hay leads con estos filtros"
            description="Registra un prospecto para empezar a dar seguimiento."
            action={<LinkButton to="/dashboard/pipeline/nuevo"><Plus />Nuevo lead</LinkButton>}
          />
        }
      >
        <div className="space-y-4">
          <LeadTable leads={leads.data?.data ?? []} />
          <Pagination meta={leads.data?.meta} onPageChange={setPage} />
        </div>
      </QueryBoundary>
    </div>
  );
}
