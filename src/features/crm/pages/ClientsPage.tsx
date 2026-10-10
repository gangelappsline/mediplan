import { Search, UserPlus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Avatar } from '@/features/crm/components/Avatar';
import {
  ClientSourceBadge,
  ClientStatusBadge,
  TagChip,
} from '@/features/crm/components/Badges';
import { StatCard } from '@/features/crm/components/StatCard';
import { formatRelativeDay, timeAgo } from '@/features/crm/format';
import { clientSourceMeta, clientStatusMeta, crmIcons } from '@/features/crm/labels';
import { useCrm } from '@/features/crm/hooks/useCrm';
import { dashboardStats, filterClients, tasksForClient } from '@/features/crm/selectors';
import type { ClientSource, ClientStatus } from '@/features/crm/types';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { PageHeader } from '@/shared/components/PageHeader';
import { cn } from '@/shared/lib/utils';

const PAGE_SIZE = 8;

const statusFilters: ReadonlyArray<{ value: ClientStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'lead', label: clientStatusMeta.lead.label },
  { value: 'active', label: clientStatusMeta.active.label },
  { value: 'inactive', label: clientStatusMeta.inactive.label },
  { value: 'vip', label: clientStatusMeta.vip.label },
];

/** Listado de clientes del CRM con búsqueda, filtros y paginación. */
function ClientsPage() {
  const { data } = useCrm();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ClientStatus | 'all'>('all');
  const [source, setSource] = useState<ClientSource | 'all'>('all');
  const [tag, setTag] = useState<string>('all');
  const [page, setPage] = useState(1);

  const stats = dashboardStats(data);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const client of data.clients) {
      for (const item of client.tags) set.add(item);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [data.clients]);

  const filtered = useMemo(
    () =>
      filterClients(data.clients, {
        query,
        status,
        source,
        tag: tag === 'all' ? undefined : tag,
      }),
    [data.clients, query, status, source, tag],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function clearFilters() {
    setQuery('');
    setStatus('all');
    setSource('all');
    setTag('all');
    setPage(1);
  }

  const hasActiveFilters = query !== '' || status !== 'all' || source !== 'all' || tag !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Tu base de clientes con estado, origen, etiquetas y próximo seguimiento. Todo el historial en una sola ficha."
        actions={
          <Button asChild>
            <Link to="/dashboard/clientes/nuevo">
              <UserPlus />
              Nuevo cliente
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de clientes"
          value={stats.totalClients}
          icon={crmIcons.users}
          tone="primary"
        />
        <StatCard
          title="Activos + VIP"
          value={stats.activeClients}
          hint={`${stats.vip} clientes VIP`}
          icon={crmIcons.heart}
          tone="success"
        />
        <StatCard
          title="Leads por convertir"
          value={stats.leads}
          hint="Dales seguimiento esta semana"
          icon={crmIcons.sparkles}
          tone="warn"
        />
        <StatCard
          title="Seguimientos pendientes"
          value={stats.pendingTasks}
          hint={`${stats.overdue} vencidos`}
          icon={crmIcons.clock}
          tone={stats.overdue > 0 ? 'danger' : 'info'}
          href="/dashboard/seguimientos"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar clientes"
            placeholder="Buscar por nombre, correo, teléfono…"
            className="pl-9"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={source}
          onValueChange={(value) => {
            setSource(value as ClientSource | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label="Filtrar por origen">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            {(Object.keys(clientSourceMeta) as ClientSource[]).map((item) => (
              <SelectItem key={item} value={item}>
                {clientSourceMeta[item].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tag}
          onValueChange={(value) => {
            setTag(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label="Filtrar por etiqueta">
            <SelectValue placeholder="Etiqueta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etiquetas</SelectItem>
            {allTags.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <X />
            Limpiar
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              status === filter.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={crmIcons.user}
          title="No hay clientes con esos filtros"
          description="Prueba con otra búsqueda o limpia los filtros para ver toda tu base de clientes."
          action={
            <Button type="button" variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Etiquetas</th>
                  <th className="px-4 py-3 font-medium">Último contacto</th>
                  <th className="px-4 py-3 font-medium">Próximo seguimiento</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((client) => {
                  const nextTask = tasksForClient(data, client.id).find(
                    (task) => task.status === 'pending',
                  );

                  return (
                    <tr
                      key={client.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/dashboard/clientes/${client.id}`}
                          className="flex items-center gap-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <Avatar name={client.name} size="sm" />
                          <span>
                            <span className="block font-medium">{client.name}</span>
                            {client.company ? (
                              <span className="block text-xs text-muted-foreground">
                                {client.company}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="block">{client.phone || '—'}</span>
                        <span className="block text-xs">{client.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ClientStatusBadge status={client.status} />
                      </td>
                      <td className="px-4 py-3">
                        <ClientSourceBadge source={client.source} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap gap-1">
                          {client.tags.slice(0, 2).map((item) => (
                            <TagChip key={item} label={item} />
                          ))}
                          {client.tags.length > 2 ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              +{client.tags.length - 2}
                            </Badge>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {client.lastContactAt ? timeAgo(client.lastContactAt) : 'Sin contacto'}
                      </td>
                      <td className="px-4 py-3">
                        {nextTask ? (
                          <span
                            className={cn(
                              'text-muted-foreground',
                              new Date(nextTask.dueAt).getTime() < Date.now() &&
                                'font-medium text-rose-600 dark:text-rose-400',
                            )}
                          >
                            {formatRelativeDay(nextTask.dueAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/dashboard/clientes/${client.id}`}>Ver ficha</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Mostrando {pageItems.length} de {filtered.length} clientes
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  setPage(currentPage - 1);
                }}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setPage(currentPage + 1);
                }}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { ClientsPage };
