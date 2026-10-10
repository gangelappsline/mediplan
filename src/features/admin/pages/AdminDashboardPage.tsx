import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { PlatformMap } from '@/features/admin/components/PlatformMap';
import { useAdminDashboard } from '@/features/admin/hooks';
import { Avatar } from '@/shared/components/Avatar';
import { DonutChart } from '@/shared/components/Charts';
import { LinkButton } from '@/shared/components/LinkButton';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AnimatedNumber } from '@/shared/components/motion/AnimatedNumber';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Meter } from '@/shared/components/ui/meter';
import { ChartSkeleton, EntityCardSkeleton, FlowSkeleton, Skeleton, StatCardSkeleton } from '@/shared/components/ui/skeleton';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { listItem, springSoft } from '@/shared/lib/animations';
import { formatDate, timeAgo } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { AdminDashboardData } from '@/types';

/** Porcentaje seguro (evita NaN cuando el total es 0). */
function ratio(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();
  const data = dashboard.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plataforma"
        icon={ShieldCheck}
        title="Panel de administración"
        description="Estado general de MediPlan: cuentas, negocios, prospectos y citas."
        meta={
          data ? (
            <>
              <MetaChip icon={Users} label={`${data.users.total} usuarios`} />
              <MetaChip icon={Building2} label={`${data.businesses.total} negocios`} />
              <MetaChip icon={UserRound} label={`${data.clients.total} clientes`} />
              <MetaChip icon={CalendarCheck} label={`${data.appointments.today} citas hoy`} />
            </>
          ) : null
        }
        actions={
          <>
            <Tooltip content="Actualizar datos">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Actualizar datos del panel"
                onClick={() => void dashboard.refetch()}
                disabled={dashboard.isFetching}
              >
                <RefreshCw className={cn('size-4', dashboard.isFetching && 'animate-spin')} />
              </Button>
            </Tooltip>
            <LinkButton to="/admin/usuarios/nuevo">
              <Plus />
              Nuevo usuario
            </LinkButton>
          </>
        }
      />

      <QueryBoundary
        isLoading={dashboard.isLoading}
        error={dashboard.error}
        onRetry={() => void dashboard.refetch()}
        skeleton={<DashboardSkeleton />}
        isFetching={dashboard.isFetching}
      >
        {data ? <DashboardContent data={data} /> : null}
      </QueryBoundary>
    </div>
  );
}

function DashboardContent({ data }: { data: AdminDashboardData }) {
  const inactivePercent = ratio(data.users.inactive, data.users.total);
  const activeBusinesses = data.businesses.by_status.find((status) => status.name === 'active')?.total ?? 0;
  const pendingBusinesses = data.businesses.by_status.find((status) => status.name === 'pending')?.total ?? 0;

  return (
    <>
      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            title="Usuarios"
            value={data.users.total}
            hint={`${data.users.new_last_month} nuevos el último mes · ${data.users.inactive} inactivos`}
            icon={Users}
            href="/admin/usuarios"
            tooltip="Abrir el listado de usuarios"
            footer={
              <Meter
                value={data.users.total - data.users.inactive}
                max={Math.max(1, data.users.total)}
                label="Usuarios activos"
                barClassName="bg-emerald-500"
              >
                <p className="text-[11px] text-muted-foreground">{100 - inactivePercent}% activos</p>
              </Meter>
            }
          />
        </StaggerItem>

        <StaggerItem>
          <StatCard
            title="Negocios"
            value={data.businesses.total}
            hint={`${data.businesses.new_last_month} nuevos el último mes`}
            icon={Building2}
            tone="primary"
            href="/admin/negocios"
            tooltip="Abrir el listado de negocios"
            footer={
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
                  {activeBusinesses} activos
                </span>
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden className="size-2 rounded-full bg-amber-500" />
                  {pendingBusinesses} pendientes
                </span>
              </div>
            }
          />
        </StaggerItem>

        <StaggerItem>
          <StatCard
            title="Leads abiertos"
            value={data.leads.open}
            hint={`${data.leads.total} en total · ${data.leads.won} ganados`}
            icon={Target}
            tone="warn"
            href="/admin/leads"
            tooltip="Abrir los leads de la plataforma"
            footer={
              <Meter
                value={data.leads.conversion_rate}
                label="Tasa de conversión de leads"
                barClassName="bg-amber-500"
              >
                <p className="text-[11px] text-muted-foreground">
                  <AnimatedNumber value={data.leads.conversion_rate} decimals={1} />% de conversión
                </p>
              </Meter>
            }
          />
        </StaggerItem>

        <StaggerItem>
          <StatCard
            title="Citas próximas"
            value={data.appointments.upcoming}
            hint={`${data.appointments.today} hoy · ${data.appointments.completed} completadas`}
            icon={CalendarCheck}
            tone="success"
            tooltip="Citas de todos los negocios"
            footer={
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <TrendingUp className="size-3.5 text-emerald-500" />
                <AnimatedNumber value={data.appointments.total} /> en total registradas
              </div>
            }
          />
        </StaggerItem>
      </StaggerList>

      <motion.section variants={listItem} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <Card className="gap-4 py-5">
          <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-base">Mapa de la plataforma</CardTitle>
              <CardDescription>
                Cómo se relacionan las entidades de MediPlan y cuántas hay ahora mismo.
              </CardDescription>
            </div>
            <Link
              to="/admin/negocios"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
            >
              Ver negocios
              <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <PlatformMap data={data} />
          </CardContent>
        </Card>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios por rol</CardTitle>
            <CardDescription>Distribución de las {data.users.total} cuentas activas y suspendidas.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={data.users.by_role.map((role) => ({ label: role.label, value: role.total }))}
              center={
                <>
                  <span className="text-2xl font-bold">
                    <AnimatedNumber value={data.users.total} />
                  </span>
                  <span className="text-[11px] text-muted-foreground">usuarios</span>
                </>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Negocios por estado</CardTitle>
            <CardDescription>Alta, revisión y suspensiones de clínicas.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={data.businesses.by_status.map((status, index) => ({
                label: status.label,
                value: status.total,
                strokeClass: ['stroke-emerald-500', 'stroke-amber-500', 'stroke-rose-500'][index % 3],
              }))}
              center={
                <>
                  <span className="text-2xl font-bold">
                    <AnimatedNumber value={data.businesses.total} />
                  </span>
                  <span className="text-[11px] text-muted-foreground">negocios</span>
                </>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salud de la plataforma</CardTitle>
            <CardDescription>Indicadores rápidos de actividad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <HealthRow
              label="Usuarios activos"
              value={data.users.total - data.users.inactive}
              total={data.users.total}
              barClassName="bg-emerald-500"
            />
            <HealthRow
              label="Negocios activos"
              value={activeBusinesses}
              total={data.businesses.total}
              barClassName="bg-primary"
            />
            <HealthRow
              label="Leads ganados"
              value={data.leads.won}
              total={data.leads.total}
              barClassName="bg-amber-500"
            />
            <HealthRow
              label="Clientes nuevos (mes)"
              value={data.clients.new_last_month}
              total={data.clients.total}
              barClassName="bg-sky-500"
            />
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-2xl font-bold">
                <AnimatedNumber value={data.clients.total} />
              </p>
              <p className="text-xs text-muted-foreground">
                pacientes registrados en todas las clínicas · {data.clients.new_last_month} nuevos el último mes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>Usuarios recientes</CardTitle>
            <Link to="/admin/usuarios" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos
              <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <StaggerList className="space-y-1">
              {data.recent_users.map((user) => (
                <StaggerItem key={user.id}>
                  <Link
                    to={`/admin/usuarios/${user.id}`}
                    className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <StatusBadge name={user.is_active ? 'active' : 'inactive'} label={user.is_active ? 'Activo' : 'Inactivo'} />
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>Negocios recientes</CardTitle>
            <Link to="/admin/negocios" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos
              <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <StaggerList className="space-y-1">
              {data.recent_businesses.map((business) => (
                <StaggerItem key={business.id}>
                  <Link
                    to={`/admin/negocios/${business.id}`}
                    className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Avatar name={business.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{business.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {business.created_at ? `${timeAgo(business.created_at)} · ${formatDate(business.created_at)}` : 'Sin fecha de alta'}
                      </p>
                    </div>
                    <StatusBadge name={business.status.name} label={business.status.label} />
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* --------------------------------- Piezas --------------------------------- */

function MetaChip({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <motion.span
      whileHover={{ y: -1 }}
      transition={springSoft}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground"
    >
      <Icon className="size-3.5 text-primary" />
      {label}
    </motion.span>
  );
}

function HealthRow({
  label,
  value,
  total,
  barClassName,
}: {
  label: string;
  value: number;
  total: number;
  barClassName?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          <AnimatedNumber value={value} />
          <span className="text-xs font-normal text-muted-foreground"> / {total}</span>
        </span>
      </div>
      <Meter value={value} max={Math.max(1, total)} label={label} barClassName={barClassName} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-72" />
        <FlowSkeleton className="border-0" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <Skeleton className="h-4 w-32" />
          <ChartSkeleton bars={3} />
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <Skeleton className="h-4 w-32" />
          <ChartSkeleton bars={3} />
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <Skeleton className="h-4 w-40" />
          <ChartSkeleton bars={4} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <EntityCardSkeleton />
        <EntityCardSkeleton />
      </div>
    </div>
  );
}
