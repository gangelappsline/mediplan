import { Plus, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useClients } from '@/features/business/hooks';
import { CLIENT_STATUS_OPTIONS } from '@/features/business/labels';
import type { ClientListQuery } from '@/features/business/api';
import { Avatar } from '@/shared/components/Avatar';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { LinkButton } from '@/shared/components/LinkButton';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { formatDate } from '@/shared/lib/format';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const ALL = 'all';

type SortValue = 'name:asc' | 'name:desc' | 'created_at:desc' | 'created_at:asc' | 'last_appointment_at:desc';

const SORT_OPTIONS: ReadonlyArray<{ value: SortValue; label: string }> = [
  { value: 'name:asc', label: 'Nombre (A–Z)' },
  { value: 'name:desc', label: 'Nombre (Z–A)' },
  { value: 'created_at:desc', label: 'Más recientes' },
  { value: 'created_at:asc', label: 'Más antiguos' },
  { value: 'last_appointment_at:desc', label: 'Última cita' },
];

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<string>(ALL);
  const [sort, setSort] = useState<SortValue>('name:asc');
  const [page, setPage] = useState(1);

  const [sortField, direction] = sort.split(':') as [NonNullable<ClientListQuery['sort']>, 'asc' | 'desc'];
  const query: ClientListQuery = {
    search: debouncedSearch || undefined,
    status: status === ALL ? '' : (status as 'active' | 'inactive'),
    sort: sortField,
    direction,
    page,
    per_page: 15,
  };
  const clients = useClients(query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Tu base de pacientes y clientes."
        actions={
          <LinkButton to="/dashboard/clientes/nuevo">
            <Plus />
            Nuevo cliente
          </LinkButton>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, correo o teléfono"
              aria-label="Buscar clientes"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {CLIENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortValue);
              setPage(1);
            }}
          >
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
        isLoading={clients.isLoading}
        error={clients.error}
        onRetry={() => void clients.refetch()}
        isEmpty={clients.data?.data.length === 0}
        emptyState={
          <EmptyState
            icon={Users}
            title="No encontramos clientes"
            description="Ajusta los filtros o registra tu primer cliente."
            action={
              <LinkButton to="/dashboard/clientes/nuevo">
                <Plus />
                Nuevo cliente
              </LinkButton>
            }
          />
        }
      >
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Contacto</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Citas</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Última cita</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.data?.data.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/clientes/${client.id}`} className="flex items-center gap-3">
                        <Avatar name={client.name} size="sm" />
                        <span className="font-medium hover:underline">{client.name}</span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {client.email ?? client.phone ?? '—'}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">{client.appointments_count ?? 0}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {client.last_appointment_at ? formatDate(client.last_appointment_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge name={client.status.name} label={client.status.label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4">
            <Pagination meta={clients.data?.meta} onPageChange={setPage} />
          </div>
        </Card>
      </QueryBoundary>
    </div>
  );
}
