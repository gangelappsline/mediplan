import { Building2, CalendarCheck, Target, Users } from 'lucide-react';

import { useAdminDashboard } from '@/features/admin/hooks';
import { HBarChart } from '@/shared/components/Charts';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Avatar } from '@/shared/components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Link } from 'react-router-dom';
import { formatDate, timeAgo } from '@/shared/lib/format';

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="Panel de administración" description="Estado general de la plataforma MediPlan." />
      <QueryBoundary isLoading={dashboard.isLoading} error={dashboard.error} onRetry={() => void dashboard.refetch()}>
        {dashboard.data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Usuarios"
                value={dashboard.data.users.total}
                hint={`${dashboard.data.users.new_last_month} nuevos el último mes · ${dashboard.data.users.inactive} inactivos`}
                icon={Users}
                href="/admin/usuarios"
              />
              <StatCard
                title="Negocios"
                value={dashboard.data.businesses.total}
                hint={`${dashboard.data.businesses.new_last_month} nuevos el último mes`}
                icon={Building2}
                tone="primary"
                href="/admin/negocios"
              />
              <StatCard
                title="Leads abiertos"
                value={dashboard.data.leads.open}
                hint={`${dashboard.data.leads.total} en total · ${dashboard.data.leads.conversion_rate}% de conversión`}
                icon={Target}
                tone="warn"
                href="/admin/leads"
              />
              <StatCard
                title="Citas próximas"
                value={dashboard.data.appointments.upcoming}
                hint={`${dashboard.data.appointments.today} hoy · ${dashboard.data.appointments.completed} completadas`}
                icon={CalendarCheck}
                tone="success"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Usuarios por rol</CardTitle>
                </CardHeader>
                <CardContent>
                  <HBarChart data={dashboard.data.users.by_role.map((role) => ({ label: role.label, value: role.total }))} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Negocios por estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <HBarChart data={dashboard.data.businesses.by_status.map((status) => ({ label: status.label, value: status.total }))} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Clientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-3xl font-bold tabular-nums">{dashboard.data.clients.total}</p>
                  <p className="text-muted-foreground">{dashboard.data.clients.new_last_month} nuevos el último mes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Usuarios recientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboard.data.recent_users.map((user) => (
                    <Link key={user.id} to={`/admin/usuarios/${user.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <StatusBadge name={user.is_active ? 'active' : 'inactive'} label={user.is_active ? 'Activo' : 'Inactivo'} />
                    </Link>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Negocios recientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboard.data.recent_businesses.map((business) => (
                    <Link key={business.id} to={`/admin/negocios/${business.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                      <Avatar name={business.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{business.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {business.created_at ? `${timeAgo(business.created_at)} · ${formatDate(business.created_at)}` : ''}
                        </p>
                      </div>
                      <StatusBadge name={business.status.name} label={business.status.label} />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}
