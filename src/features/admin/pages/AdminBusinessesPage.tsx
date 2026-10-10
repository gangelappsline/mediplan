import { Building2, LayoutGrid, RefreshCw, Table2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { BusinessCard } from '@/features/admin/components/BusinessCard';
import { BusinessesTable } from '@/features/admin/components/BusinessesTable';
import { useAdminBusinesses, useAdminDashboard } from '@/features/admin/hooks';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { FilterPills, SearchInput, Toolbar, ToolbarSummary, ViewToggle, type PillOption } from '@/shared/components/Toolbar';
import { Button } from '@/shared/components/ui/button';
import { EntityCardSkeleton, TableSkeleton } from '@/shared/components/ui/skeleton';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { swapVariants } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';
import type { BusinessStatusName } from '@/types';

const ALL = 'all';

const STATUS_OPTIONS: ReadonlyArray<{ value: BusinessStatusName; label: string }> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
];

const VIEW_OPTIONS = [
  { value: 'table', label: 'Vista de tabla', icon: Table2 },
  { value: 'cards', label: 'Vista de tarjetas', icon: LayoutGrid },
] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number]['value'];
type StatusFilter = typeof ALL | BusinessStatusName;

/** Listado de negocios de la plataforma (`GET /admin/businesses`). */
export function AdminBusinessesPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<StatusFilter>(ALL);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = usePersistentState<number>('mediplan-admin-businesses-per-page', 15);
  const [view, setView] = usePersistentState<ViewMode>('mediplan-admin-businesses-view', 'table');

  const businesses = useAdminBusinesses({
    search: debounced || undefined,
    status: status === ALL ? '' : status,
    page,
    per_page: perPage,
  });

  // Conteos globales por estado para las pastillas (mismo endpoint del resumen).
  const dashboard = useAdminDashboard();
  const list = businesses.data?.data ?? [];
  const total = businesses.data?.meta.total ?? 0;

  const pills: ReadonlyArray<PillOption<StatusFilter>> = [
    { value: ALL, label: 'Todos', count: dashboard.data?.businesses.total },
    ...STATUS_OPTIONS.map((option) => ({
      value: option.value as StatusFilter,
      label: option.label,
      count: dashboard.data?.businesses.by_status.find((item) => item.name === option.value)?.total,
    })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        icon={Building2}
        title="Negocios"
        description="Clínicas y negocios registrados en MediPlan, con su estado de operación."
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por nombre, correo o ciudad"
          ariaLabel="Buscar negocios"
          busy={businesses.isFetching}
        />
        <FilterPills
          options={pills}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          ariaLabel="Filtrar negocios por estado"
        />
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSummary className="hidden lg:block">
            {businesses.isLoading ? (
              'Cargando…'
            ) : (
              <>
                <span className="font-semibold text-foreground tabular-nums">{total}</span>{' '}
                {total === 1 ? 'negocio' : 'negocios'}
              </>
            )}
          </ToolbarSummary>
          <Tooltip content="Actualizar listado">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Actualizar listado de negocios"
              onClick={() => void businesses.refetch()}
              disabled={businesses.isFetching}
            >
              <RefreshCw className={cn('size-4', businesses.isFetching && 'animate-spin')} />
            </Button>
          </Tooltip>
          <ViewToggle options={VIEW_OPTIONS} value={view} onChange={setView} ariaLabel="Cambiar vista de negocios" />
        </div>
      </Toolbar>

      <QueryBoundary
        isLoading={businesses.isLoading}
        error={businesses.error}
        onRetry={() => void businesses.refetch()}
        isEmpty={list.length === 0}
        isFetching={businesses.isFetching}
        skeleton={view === 'table' ? <TableSkeleton rows={8} columns={5} /> : <CardsSkeleton />}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No hay negocios con estos filtros"
            description="Cambia la búsqueda o el estado para ver otros resultados."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus(ALL);
                  setPage(1);
                }}
              >
                Limpiar filtros
              </Button>
            }
          />
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} variants={swapVariants} initial="initial" animate="enter" exit="exit">
            {view === 'table' ? (
              <BusinessesTable businesses={list} />
            ) : (
              <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((business) => (
                  <StaggerItem key={business.id} className="h-full">
                    <BusinessCard business={business} />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 rounded-xl border border-border/60 bg-card px-4 py-3">
          <Pagination
            meta={businesses.data?.meta}
            onPageChange={setPage}
            onPerPageChange={(next) => {
              setPerPage(next);
              setPage(1);
            }}
          />
        </div>
      </QueryBoundary>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <EntityCardSkeleton key={index} />
      ))}
    </div>
  );
}
