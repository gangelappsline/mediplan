import { ArrowUpRight, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { RolesAccessMap } from '@/features/admin/components/RolesAccessMap';
import { useAdminRoles } from '@/features/admin/hooks';
import { DonutChart } from '@/shared/components/Charts';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { AnimatedNumber } from '@/shared/components/motion/AnimatedNumber';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Meter } from '@/shared/components/ui/meter';
import { ChartSkeleton, EntityCardSkeleton, FlowSkeleton, Skeleton } from '@/shared/components/ui/skeleton';
import type { RoleCatalogItem } from '@/types';

/** Catálogo de roles de la plataforma (`GET /admin/roles`) y su mapa de acceso. */
export function AdminRolesPage() {
  const roles = useAdminRoles();
  const list = roles.data ?? [];
  const totalUsers = list.reduce((total, role) => total + (role.users_count ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        icon={ShieldCheck}
        title="Roles"
        description="Qué puede hacer cada rol y cuántos usuarios lo tienen asignado."
      />

      <QueryBoundary
        isLoading={roles.isLoading}
        error={roles.error}
        onRetry={() => void roles.refetch()}
        skeleton={<RolesSkeleton />}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="gap-4 py-5 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Mapa de acceso por rol</CardTitle>
              <CardDescription>
                Cada rol abre un panel distinto de MediPlan. Selecciona un rol para resaltar sus pantallas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolesAccessMap roles={list} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución</CardTitle>
              <CardDescription>Usuarios por rol en toda la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={list.map((role) => ({ label: role.label, value: role.users_count ?? 0 }))}
                center={
                  <>
                    <span className="text-2xl font-bold">
                      <AnimatedNumber value={totalUsers} />
                    </span>
                    <span className="text-[11px] text-muted-foreground">usuarios</span>
                  </>
                }
              />
            </CardContent>
          </Card>
        </div>

        <StaggerList className="grid gap-4 md:grid-cols-3">
          {list.map((role) => (
            <StaggerItem key={role.id} className="h-full">
              <RoleCard role={role} totalUsers={totalUsers} />
            </StaggerItem>
          ))}
        </StaggerList>
      </QueryBoundary>
    </div>
  );
}

function RoleCard({ role, totalUsers }: { role: RoleCatalogItem; totalUsers: number }) {
  const count = role.users_count ?? 0;

  return (
    <Card className="h-full gap-4 py-5 transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle>{role.label}</CardTitle>
            <CardDescription className="line-clamp-2">{role.description ?? `Rol «${role.name}»`}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold">
          <AnimatedNumber value={count} />
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            {count === 1 ? 'usuario' : 'usuarios'}
          </span>
        </p>
        <Meter value={count} max={Math.max(1, totalUsers)} label={`Proporción de usuarios con el rol ${role.label}`}>
          <p className="text-[11px] text-muted-foreground">
            {totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}% del total de cuentas
          </p>
        </Meter>
        <Button type="button" variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/usuarios">
            <Users />
            Gestionar usuarios
            <ArrowUpRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RolesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border bg-card p-6 lg:col-span-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-80" />
          <FlowSkeleton className="border-0" />
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <Skeleton className="h-4 w-32" />
          <ChartSkeleton bars={3} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <EntityCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
