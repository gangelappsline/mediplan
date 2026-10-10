import { BadgeDollarSign, CalendarClock, LayoutGrid, RefreshCw, Table2, Target, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { LeadDetailDrawer } from '@/features/admin/components/LeadDetailDrawer';
import { LeadsBoard } from '@/features/admin/components/LeadsBoard';
import { LeadsTable } from '@/features/admin/components/LeadsTable';
import { useAdminBusinesses, useAdminLeads } from '@/features/admin/hooks';
import { LEAD_STATUS_OPTIONS } from '@/features/business/labels';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { AnimatedNumber } from '@/shared/components/motion/AnimatedNumber';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { FilterPills, SearchInput, Toolbar, ViewToggle, type PillOption } from '@/shared/components/Toolbar';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Skeleton, TableSkeleton } from '@/shared/components/ui/skeleton';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { swapVariants } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';
import { dayDiff, formatMoney } from '@/shared/lib/format';
import type { Lead } from '@/types';

const ALL = 'all';

const VIEW_OPTIONS = [
  { value: 'table', label: 'Vista de tabla', icon: Table2 },
  { value: 'board', label: 'Vista de tablero', icon: LayoutGrid },
] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number]['value'];

/** Vista de plataforma de los leads de todos los negocios (`GET /admin/leads`). */
export function AdminLeadsPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<string>(ALL);
  const [businessId, setBusinessId] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = usePersistentState<number>('mediplan-admin-leads-per-page', 15);
  const [view, setView] = usePersistentState<ViewMode>('mediplan-admin-leads-view', 'table');
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const businesses = useAdminBusinesses({ per_page: 100 });
  const leads = useAdminLeads({
    search: debounced || undefined,
    status: status === ALL ? '' : status,
    business_id: businessId === ALL ? undefined : Number(businessId),
    page,
    per_page: perPage,
  });

  const list = leads.data?.data ?? [];

  const summary = useMemo(() => {
    const value = list.reduce((total, lead) => total + (lead.estimated_value ?? 0), 0);
    const overdue = list.filter(
      (lead) => lead.follow_up_at && dayDiff(lead.follow_up_at) < 0 && lead.status.name !== 'won' && lead.status.name !== 'lost',
    ).length;
    const won = list.filter((lead) => lead.status.name === 'won').length;
    return { value, overdue, won };
  }, [list]);

  const statusPills: ReadonlyArray<PillOption<string>> = [
    { value: ALL, label: 'Todos' },
    ...LEAD_STATUS_OPTIONS.map((option) => ({ value: option.value as string, label: option.label })),
  ];

  function openLead(lead: Lead) {
    setActiveLead(lead);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        icon={Target}
        title="Leads"
        description="Prospectos de todos los negocios, con su valor estimado y seguimiento."
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por nombre, correo o empresa"
          ariaLabel="Buscar leads"
          busy={leads.isFetching}
          shortcut="/"
        />
        <FilterPills
          options={statusPills}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          ariaLabel="Filtrar leads por estado"
        />
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={businessId}
            onValueChange={(value) => {
              setBusinessId(value);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="w-44" aria-label="Filtrar por negocio">
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
          <Tooltip content="Actualizar listado">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Actualizar listado de leads"
              onClick={() => void leads.refetch()}
              disabled={leads.isFetching}
            >
              <RefreshCw className={cn('size-4', leads.isFetching && 'animate-spin')} />
            </Button>
          </Tooltip>
          <ViewToggle options={VIEW_OPTIONS} value={view} onChange={setView} ariaLabel="Cambiar vista de leads" />
        </div>
      </Toolbar>

      <StaggerList className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <SummaryTile
            icon={Target}
            label="Leads en esta página"
            value={list.length}
            hint={`${leads.data?.meta.total ?? 0} en total con estos filtros`}
          />
        </StaggerItem>
        <StaggerItem>
          <SummaryTile
            icon={BadgeDollarSign}
            label="Valor estimado"
            value={summary.value}
            format={(value) => formatMoney(value)}
            hint="suma de los leads mostrados"
            tone="success"
          />
        </StaggerItem>
        <StaggerItem>
          <SummaryTile
            icon={CalendarClock}
            label="Seguimientos vencidos"
            value={summary.overdue}
            hint="requieren atención del negocio"
            tone={summary.overdue > 0 ? 'danger' : 'default'}
          />
        </StaggerItem>
        <StaggerItem>
          <SummaryTile icon={Trophy} label="Ganados" value={summary.won} hint="en la página actual" tone="warn" />
        </StaggerItem>
      </StaggerList>

      <QueryBoundary
        isLoading={leads.isLoading}
        error={leads.error}
        onRetry={() => void leads.refetch()}
        isEmpty={list.length === 0}
        isFetching={leads.isFetching}
        skeleton={view === 'table' ? <TableSkeleton rows={8} columns={6} /> : <BoardSkeleton />}
        emptyState={
          <EmptyState
            icon={Target}
            title="No hay leads con estos filtros"
            description="Prueba con otra búsqueda, estado o negocio."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus(ALL);
                  setBusinessId(ALL);
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
              <LeadsTable leads={list} onOpenLead={openLead} />
            ) : (
              <LeadsBoard leads={list} onOpenLead={openLead} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 rounded-xl border border-border/60 bg-card px-4 py-3">
          <Pagination
            meta={leads.data?.meta}
            onPageChange={setPage}
            onPerPageChange={(next) => {
              setPerPage(next);
              setPage(1);
            }}
            perPageOptions={[15, 25, 50, 100]}
          />
        </div>
      </QueryBoundary>

      <LeadDetailDrawer lead={activeLead} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}

interface SummaryTileProps {
  icon: typeof Target;
  label: string;
  value: number;
  hint?: string;
  format?: (value: number) => string;
  tone?: 'default' | 'success' | 'warn' | 'danger';
}

function SummaryTile({ icon: Icon, label, value, hint, format, tone = 'default' }: SummaryTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-3 shadow-sm">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          tone === 'success' && 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
          tone === 'warn' && 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
          tone === 'danger' && 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
          tone === 'default' && 'bg-primary/12 text-primary',
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="text-lg leading-tight font-bold">
          <AnimatedNumber value={value} format={format} />
        </p>
        {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-full rounded-md" />
        ))}
      </div>
      <div className="scroll-area flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="w-72 shrink-0 space-y-2 rounded-xl border bg-muted/30 p-2.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
