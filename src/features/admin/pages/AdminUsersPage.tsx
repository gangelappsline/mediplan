import { LayoutGrid, Plus, RefreshCw, Table2, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { UserCard } from '@/features/admin/components/UserCard';
import { UserRolesDialog } from '@/features/admin/components/UserRolesDialog';
import { UsersTable } from '@/features/admin/components/UsersTable';
import { useAdminUsers } from '@/features/admin/hooks';
import { LinkButton } from '@/shared/components/LinkButton';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { SearchInput, Toolbar, ToolbarSummary, ViewToggle } from '@/shared/components/Toolbar';
import { Button } from '@/shared/components/ui/button';
import { EntityCardSkeleton, TableSkeleton } from '@/shared/components/ui/skeleton';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { swapVariants } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';
import type { User } from '@/types';

const VIEW_OPTIONS = [
  { value: 'table', label: 'Vista de tabla', icon: Table2 },
  { value: 'cards', label: 'Vista de tarjetas', icon: LayoutGrid },
] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number]['value'];

/** Listado de usuarios de la plataforma (`GET /admin/users`). */
export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = usePersistentState<number>('mediplan-admin-users-per-page', 15);
  const [view, setView] = usePersistentState<ViewMode>('mediplan-admin-users-view', 'table');
  const [rolesTarget, setRolesTarget] = useState<User | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);

  function openRoles(user: User) {
    setRolesTarget(user);
    setRolesOpen(true);
  }

  const users = useAdminUsers({ search: debounced || undefined, page, per_page: perPage });
  const list = users.data?.data ?? [];
  const total = users.data?.meta.total ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        icon={Users}
        title="Usuarios"
        description="Cuentas de clientes, negocios y administradores de MediPlan."
        actions={
          <LinkButton to="/admin/usuarios/nuevo">
            <Plus />
            Nuevo usuario
          </LinkButton>
        }
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por nombre o correo"
          ariaLabel="Buscar usuarios"
          busy={users.isFetching}
          shortcut="/"
        />
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSummary className="hidden sm:block">
            {users.isLoading ? (
              'Cargando…'
            ) : (
              <>
                <span className="font-semibold text-foreground tabular-nums">{total}</span>{' '}
                {total === 1 ? 'usuario' : 'usuarios'}
                {debounced ? ` para «${debounced}»` : ''}
              </>
            )}
          </ToolbarSummary>
          <Tooltip content="Actualizar listado">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Actualizar listado de usuarios"
              onClick={() => void users.refetch()}
              disabled={users.isFetching}
            >
              <RefreshCw className={cn('size-4', users.isFetching && 'animate-spin')} />
            </Button>
          </Tooltip>
          <ViewToggle options={VIEW_OPTIONS} value={view} onChange={setView} ariaLabel="Cambiar vista de usuarios" />
        </div>
      </Toolbar>

      <QueryBoundary
        isLoading={users.isLoading}
        error={users.error}
        onRetry={() => void users.refetch()}
        isEmpty={list.length === 0}
        isFetching={users.isFetching}
        skeleton={view === 'table' ? <TableSkeleton rows={8} columns={5} /> : <CardsSkeleton />}
        emptyState={
          <EmptyState
            icon={Users}
            title="No hay usuarios que coincidan"
            description={debounced ? `Sin resultados para «${debounced}».` : 'Todavía no hay cuentas registradas.'}
            action={
              debounced ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                >
                  Limpiar búsqueda
                </Button>
              ) : (
                <LinkButton to="/admin/usuarios/nuevo" variant="outline" size="sm">
                  <Plus />
                  Crear el primer usuario
                </LinkButton>
              )
            }
          />
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} variants={swapVariants} initial="initial" animate="enter" exit="exit">
            {view === 'table' ? (
              <UsersTable users={list} onManageRoles={openRoles} />
            ) : (
              <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((user) => (
                  <StaggerItem key={user.id} className="h-full">
                    <UserCard user={user} onManageRoles={openRoles} />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 rounded-xl border border-border/60 bg-card px-4 py-3">
          <Pagination
            meta={users.data?.meta}
            onPageChange={setPage}
            onPerPageChange={(next) => {
              setPerPage(next);
              setPage(1);
            }}
          />
        </div>
      </QueryBoundary>

      {rolesTarget ? (
        <UserRolesDialog open={rolesOpen} onOpenChange={setRolesOpen} user={rolesTarget} />
      ) : null}
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
