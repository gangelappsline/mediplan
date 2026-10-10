import { CalendarCheck, CalendarClock, CalendarX, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useClientDashboard } from '@/features/cliente/hooks';
import { AppointmentCardLink } from '@/features/cliente/components/AppointmentCardLink';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatRelativeDay, formatTime } from '@/shared/lib/format';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export function ClientDashboardPage() {
  const dashboard = useClientDashboard();
  const user = useCurrentUser();
  const firstName = (user?.name ?? '').split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader title={firstName ? `Hola, ${firstName}` : 'Hola'} description="Tus citas y los negocios donde estás registrado." />
      <QueryBoundary isLoading={dashboard.isLoading} error={dashboard.error} onRetry={() => void dashboard.refetch()}>
        {dashboard.data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Próximas citas" value={dashboard.data.appointments.upcoming_count} icon={CalendarClock} tone="primary" href="/cuenta/citas" />
              <StatCard title="Completadas" value={dashboard.data.appointments.completed} icon={CalendarCheck} tone="success" href="/cuenta/citas" />
              <StatCard title="Canceladas" value={dashboard.data.appointments.cancelled} icon={CalendarX} tone="danger" href="/cuenta/citas" />
              <StatCard
                title="Negocios"
                value={dashboard.data.businesses.registered_in}
                hint={`${dashboard.data.businesses.available} disponibles`}
                icon={Store}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Próximas citas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboard.data.upcoming_appointments.length === 0 ? (
                    <EmptyState icon={CalendarClock} title="No tienes citas próximas" description="Cuando un negocio te agende, la verás aquí." />
                  ) : (
                    dashboard.data.upcoming_appointments.map((appointment) => (
                      <AppointmentCardLink key={appointment.id} appointment={appointment} />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Siguiente cita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {dashboard.data.appointments.next ? (
                    <>
                      <p className="text-lg font-semibold">{dashboard.data.appointments.next.title}</p>
                      <p className="text-muted-foreground">
                        {formatRelativeDay(dashboard.data.appointments.next.starts_at)}, {formatTime(dashboard.data.appointments.next.starts_at)}
                      </p>
                      <p className="text-muted-foreground">{dashboard.data.appointments.next.business?.name ?? ''}</p>
                      <Link to={`/cuenta/citas/${dashboard.data.appointments.next.id}`} className="text-primary hover:underline">
                        Ver detalles
                      </Link>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Sin citas programadas.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}
