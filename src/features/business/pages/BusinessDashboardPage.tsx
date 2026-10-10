import { CalendarClock, CircleDollarSign, UserPlus, Users, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useBusinessDashboard } from '@/features/business/hooks';
import { LEAD_STATUS_LABEL } from '@/features/business/labels';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { Avatar } from '@/shared/components/Avatar';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDateTime, formatMoney, formatRelativeDay, formatTime, timeAgo } from '@/shared/lib/format';
import type { BusinessDashboardData } from '@/types';

export function BusinessDashboardPage() {
  const dashboard = useBusinessDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="Resumen" description="Lo más importante de tu negocio hoy." />
      <QueryBoundary isLoading={dashboard.isLoading} error={dashboard.error} onRetry={() => void dashboard.refetch()}>
        {dashboard.data ? <DashboardContent data={dashboard.data} /> : null}
      </QueryBoundary>
    </div>
  );
}

function DashboardContent({ data }: { data: BusinessDashboardData }) {
  const conversion = data.leads.conversion_rate;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Clientes activos"
          value={data.clients.active}
          hint={`${data.clients.total} en total · ${data.clients.new_this_month} nuevos este mes`}
          icon={Users}
          href="/dashboard/clientes"
        />
        <StatCard
          title="Leads abiertos"
          value={data.leads.open}
          hint={`${data.leads.total} en total · ${conversion}% de conversión`}
          icon={Target}
          tone="primary"
          href="/dashboard/pipeline"
        />
        <StatCard
          title="Citas hoy"
          value={data.appointments.today}
          hint={`${data.appointments.next_week} en los próximos 7 días`}
          icon={CalendarClock}
          tone="success"
          href="/dashboard/agenda"
        />
        <StatCard
          title="Ingresos del mes"
          value={formatMoney(data.appointments.revenue_this_month)}
          hint={`${data.appointments.completed_this_month} completadas · ${data.appointments.cancelled_this_month} canceladas`}
          icon={CircleDollarSign}
          tone="warn"
          href="/dashboard/reportes"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Próximas citas</CardTitle>
            <CardDescription>Las siguientes citas agendadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.next_appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes citas próximas.</p>
            ) : (
              data.next_appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  to={`/dashboard/agenda/citas/${appointment.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{appointment.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {appointment.client?.name ?? 'Sin cliente'} · {formatRelativeDay(appointment.starts_at)},{' '}
                      {formatTime(appointment.starts_at)}
                    </p>
                  </div>
                  <StatusBadge name={appointment.status.name} label={appointment.status.label} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por estado</CardTitle>
            <CardDescription>Distribución actual del pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.leads.by_status).map(([status, total]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span>{LEAD_STATUS_LABEL[status as keyof typeof LEAD_STATUS_LABEL] ?? status}</span>
                <span className="font-semibold tabular-nums">{total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recent_leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay leads.</p>
            ) : (
              data.recent_leads.map((lead) => (
                <Link
                  key={lead.id}
                  to={`/dashboard/pipeline/${lead.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <Avatar name={lead.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.created_at ? timeAgo(lead.created_at) : ''}</p>
                  </div>
                  <StatusBadge name={lead.status.name} label={lead.status.label} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recent_clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay clientes.</p>
            ) : (
              data.recent_clients.map((client) => (
                <Link
                  key={client.id}
                  to={`/dashboard/clientes/${client.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <Avatar name={client.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.created_at ? `Alta ${formatDateTime(client.created_at)}` : ''}
                    </p>
                  </div>
                  <UserPlus className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
