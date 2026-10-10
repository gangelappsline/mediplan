import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Plus,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSyncExternalStore } from 'react';

import { loadSession } from '@/features/auth/api';
import { Avatar } from '@/features/crm/components/Avatar';
import { StatCard } from '@/features/crm/components/StatCard';
import { formatCurrency, formatRelativeDay, formatTime, timeAgo } from '@/features/crm/format';
import { dealStageMeta, dealStageOrder, isTaskOverdue } from '@/features/crm/labels';
import { useCrm } from '@/features/crm/hooks/useCrm';
import {
  dashboardStats,
  dealsByStage,
  tasksForClient,
  todayQueue,
  upcomingAppointments,
} from '@/features/crm/selectors';
import { WhatsAppMark } from '@/features/whatsapp/components/WhatsAppMark';
import { clinicDisplayName, clinicIdFromSession } from '@/features/whatsapp/clinic';
import { readPublicConnection, subscribeWhatsApp } from '@/features/whatsapp/storage';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

/** Resumen del panel: KPIs del CRM, cola del día y estado de WhatsApp. */
function DashboardPage() {
  const session = loadSession();
  const clinicId = clinicIdFromSession();
  const { data } = useCrm();
  const connection = useSyncExternalStore(
    subscribeWhatsApp,
    () => readPublicConnection(clinicId),
    () => null,
  );
  const displayName = session?.user.name ?? 'profesional';
  const clinicName = clinicDisplayName();
  const stats = dashboardStats(data);
  const queue = todayQueue(data).slice(0, 5);
  const upcoming = upcomingAppointments(data, 5);
  const recentClients = [...data.clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const groupedDeals = dealsByStage(data);

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="outline">Panel de la clínica</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Hola, {displayName}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Esto es lo que pasa hoy en {clinicName}: seguimientos por cerrar, citas de la semana y el
          estado de tu cartera de clientes.
        </p>
      </div>

      {/* KPIs del CRM */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Clientes activos"
          value={stats.activeClients}
          hint={`${stats.totalClients} en tu base · ${stats.leads} leads`}
          icon={Users}
          tone="primary"
          href="/dashboard/clientes"
        />
        <StatCard
          title="Seguimientos para hoy"
          value={stats.dueToday + stats.overdue}
          hint={stats.overdue > 0 ? `${stats.overdue} vencidos` : 'Todo al día'}
          icon={ClipboardList}
          tone={stats.overdue > 0 ? 'danger' : 'success'}
          href="/dashboard/seguimientos"
        />
        <StatCard
          title="Pipeline abierto"
          value={formatCurrency(stats.openValue)}
          hint={`${stats.openDeals} oportunidades · ${stats.conversion}% conversión`}
          icon={Target}
          tone="info"
          href="/dashboard/pipeline"
        />
        <StatCard
          title="Citas esta semana"
          value={stats.weekAppointments}
          hint={`${upcoming.length > 0 ? `Próxima: ${formatRelativeDay(upcoming[0].startsAt)}` : 'Sin citas próximas'}`}
          icon={CalendarDays}
          tone="warn"
          href="/dashboard/agenda"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cola de trabajo del día */}
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Tu cola de hoy</CardTitle>
              <CardDescription>Seguimientos vencidos y pendientes para hoy</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/seguimientos">
                Ver todos
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.length === 0 ? (
              <p className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
                No hay seguimientos para hoy.{' '}
                <Link to="/dashboard/seguimientos" className="font-medium text-primary underline-offset-2 hover:underline">
                  Programa uno
                </Link>{' '}
                para mantener el contacto con tus clientes.
              </p>
            ) : (
              queue.map((task) => (
                <div key={task.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      isTaskOverdue(task) ? 'bg-rose-500' : 'bg-amber-500',
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {isTaskOverdue(task) ? 'Vencido' : 'Hoy'} · {formatTime(task.dueAt)} ·{' '}
                      {data.clients.find((client) => client.id === task.clientId)?.name ?? 'Cliente'}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      isTaskOverdue(task)
                        ? 'border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {isTaskOverdue(task) ? 'Vencido' : 'Hoy'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Próximas citas */}
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Próximas citas</CardTitle>
              <CardDescription>Agenda de los siguientes días</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/agenda">
                Ver agenda
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
                No hay citas programadas.{' '}
                <Link to="/dashboard/agenda" className="font-medium text-primary underline-offset-2 hover:underline">
                  Agendar una cita
                </Link>
              </p>
            ) : (
              upcoming.map((appointment) => (
                <div key={appointment.id} className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <span className="text-[10px] leading-none">
                      {new Date(appointment.startsAt).toLocaleDateString('es', { month: 'short' })}
                    </span>
                    <span className="text-sm leading-tight font-semibold">
                      {new Date(appointment.startsAt).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{appointment.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(appointment.startsAt)} ·{' '}
                      {data.clients.find((client) => client.id === appointment.clientId)?.name ??
                        'Cliente'}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatRelativeDay(appointment.startsAt)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline mini-resumen */}
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Pipeline de ventas</CardTitle>
              <CardDescription>{formatCurrency(stats.openValue)} en juego</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/pipeline">
                Abrir pipeline
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {dealStageOrder.map((stage) => {
              const deals = groupedDeals[stage];
              const total = deals.reduce((sum, deal) => sum + deal.value, 0);
              const width = stats.openValue + stats.wonValue > 0
                ? Math.round((total / (stats.openValue + stats.wonValue + 2600)) * 100)
                : 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{dealStageMeta[stage].label}</span>
                    <span className="font-medium tabular-nums">
                      {deals.length} · {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', dealStageMeta[stage].barClass)}
                      style={{ width: `${Math.max(3, width)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Clientes recientes */}
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Clientes recientes</CardTitle>
              <CardDescription>Las últimas altas en tu CRM</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/clientes">
                Ver clientes
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentClients.map((client) => {
              const nextTask = tasksForClient(data, client.id).find((task) => task.status === 'pending');
              return (
                <Link
                  key={client.id}
                  to={`/dashboard/clientes/${client.id}`}
                  className="flex items-center gap-3 rounded-lg outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <Avatar name={client.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{client.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {nextTask
                        ? `Próximo seguimiento ${formatRelativeDay(nextTask.dueAt).toLowerCase()}`
                        : `Alta ${timeAgo(client.createdAt)}`}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas + WhatsApp */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
            <CardDescription>Lo que haces todos los días, a un clic</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/dashboard/clientes/nuevo">
                <UserPlus />
                Nuevo cliente
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/seguimientos">
                <ClipboardList />
                Nuevo seguimiento
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/agenda">
                <CalendarDays />
                Agendar cita
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/pipeline">
                <Plus />
                Nueva oportunidad
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-[#25D366] text-white">
              <WhatsAppMark className="size-6" />
            </div>
            <CardTitle className="text-base">WhatsApp de la clínica</CardTitle>
            <CardDescription>
              {connection
                ? `${connection.verifiedName || 'Número sincronizado'} · ${connection.displayPhoneNumber || connection.phoneNumberId}`
                : 'Sincroniza tu número con la API oficial de Meta para enviar avisos automáticos.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/dashboard/whatsapp">
                {connection ? 'Administrar WhatsApp' : 'Sincronizar WhatsApp'}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { DashboardPage };
