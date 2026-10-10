import { Search, Target } from 'lucide-react';
import { useState } from 'react';

import { useAdminBusinesses, useAdminLeads } from '@/features/admin/hooks';
import { LEAD_STATUS_LABEL, LEAD_STATUS_OPTIONS } from '@/features/business/labels';
import { Avatar } from '@/shared/components/Avatar';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { formatDate, formatMoney } from '@/shared/lib/format';

const ALL = 'all';

/** Vista de plataforma de los leads de todos los negocios (`GET /admin/leads`). */
export function AdminLeadsPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<string>(ALL);
  const [businessId, setBusinessId] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const businesses = useAdminBusinesses({ per_page: 100 });
  const leads = useAdminLeads({
    search: debounced || undefined,
    status: status === ALL ? '' : status,
    business_id: businessId === ALL ? undefined : Number(businessId),
    page,
    per_page: 15,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Leads de la plataforma" description="Prospectos de todos los negocios." />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, correo o empresa"
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
          <Select value={businessId} onValueChange={(value) => { setBusinessId(value); setPage(1); }}>
            <SelectTrigger aria-label="Filtrar por negocio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los negocios</SelectItem>
              {(businesses.data?.data ?? []).map((business) => (
                <SelectItem key={business.id} value={String(business.id)}>
                  {business.name}
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
        emptyState={<EmptyState icon={Target} title="No hay leads con estos filtros" description="Prueba con otros criterios." />}
      >
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Negocio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Valor</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.data?.data.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{lead.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{lead.email ?? lead.phone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {lead.company ?? `Negocio #${lead.business_id}`}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        name={lead.status.name}
                        label={LEAD_STATUS_LABEL[lead.status.name as keyof typeof LEAD_STATUS_LABEL] ?? lead.status.label}
                      />
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                      {lead.estimated_value !== null ? formatMoney(lead.estimated_value) : '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {lead.created_at ? formatDate(lead.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4">
            <Pagination meta={leads.data?.meta} onPageChange={setPage} />
          </div>
        </Card>
      </QueryBoundary>
    </div>
  );
}
