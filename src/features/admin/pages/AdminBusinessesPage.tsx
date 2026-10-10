import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAdminBusinesses } from '@/features/admin/hooks';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Avatar } from '@/shared/components/Avatar';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { formatDate } from '@/shared/lib/format';
import type { BusinessStatusName } from '@/types';

const ALL = 'all';

const STATUS_OPTIONS: ReadonlyArray<{ value: BusinessStatusName; label: string }> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
];

export function AdminBusinessesPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const businesses = useAdminBusinesses({
    search: debounced || undefined,
    status: status === ALL ? '' : (status as BusinessStatusName),
    page,
    per_page: 15,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Negocios" description="Clínicas y negocios registrados en la plataforma." />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Input
            placeholder="Buscar por nombre, correo o ciudad"
            aria-label="Buscar negocios"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
            <SelectTrigger aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <QueryBoundary
        isLoading={businesses.isLoading}
        error={businesses.error}
        onRetry={() => void businesses.refetch()}
        isEmpty={businesses.data?.data.length === 0}
        emptyState={<EmptyState icon={Building2} title="No hay negocios con estos filtros" description="Cambia la búsqueda o el estado." />}
      >
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Negocio</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Ciudad</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Propietario</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Alta</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {businesses.data?.data.map((business) => (
                  <tr key={business.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/negocios/${business.id}`} className="flex items-center gap-3">
                        <Avatar name={business.name} size="sm" />
                        <span className="font-medium hover:underline">{business.name}</span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{business.city ?? '—'}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{business.owner?.name ?? '—'}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {business.created_at ? formatDate(business.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge name={business.status.name} label={business.status.label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4">
            <Pagination meta={businesses.data?.meta} onPageChange={setPage} />
          </div>
        </Card>
      </QueryBoundary>
    </div>
  );
}
