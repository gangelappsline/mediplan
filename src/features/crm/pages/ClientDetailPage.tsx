import {
  ArrowLeft,
  CalendarPlus,
  Cake,
  CircleDollarSign,
  ClipboardList,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ActivityComposer } from '@/features/crm/components/ActivityComposer';
import { AppointmentDialog } from '@/features/crm/components/AppointmentDialog';
import { Avatar } from '@/features/crm/components/Avatar';
import {
  AppointmentStatusBadge,
  ClientSourceBadge,
  ClientStatusBadge,
  DealStageBadge,
  TagChip,
  TaskPriorityBadge,
  TaskTypeBadge,
} from '@/features/crm/components/Badges';
import { DealDialog } from '@/features/crm/components/DealDialog';
import { TaskDialog } from '@/features/crm/components/TaskDialog';
import { formatDate, formatDateTime, formatRelativeDay, formatCurrency, timeAgo } from '@/features/crm/format';
import { activityKindMeta, dealStageMeta, isTaskOverdue } from '@/features/crm/labels';
import { useCrm } from '@/features/crm/hooks/useCrm';
import {
  activitiesForClient,
  appointmentsForClient,
  clientById,
  dealsForClient,
  tasksForClient,
} from '@/features/crm/selectors';
import { deleteAppointment, deleteDeal, deleteTask, toggleTaskDone } from '@/features/crm/storage';
import type { CrmAppointment, Deal, FollowUpTask } from '@/features/crm/types';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/lib/utils';

const detailTabs = [
  { value: 'actividad', label: 'Actividad' },
  { value: 'seguimientos', label: 'Seguimientos' },
  { value: 'citas', label: 'Citas' },
  { value: 'oportunidades', label: 'Oportunidades' },
] as const;

/** Ficha 360° de un cliente: datos, interacciones, seguimientos, citas y ventas. */
function ClientDetailPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const { clinicId, data } = useCrm();
  const [tab, setTab] = useState('actividad');
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: FollowUpTask }>({ open: false });
  const [dealDialog, setDealDialog] = useState<{ open: boolean; deal?: Deal }>({ open: false });
  const [appointmentDialog, setAppointmentDialog] = useState<{ open: boolean; appointment?: CrmAppointment }>({
    open: false,
  });

  const client = clienteId ? clientById(data, clienteId) : undefined;

  if (!client) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Cliente no encontrado"
        description="Puede que se haya eliminado o que el enlace sea incorrecto."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/clientes">
              <ArrowLeft />
              Volver a clientes
            </Link>
          </Button>
        }
      />
    );
  }

  const activities = activitiesForClient(data, client.id);
  const tasks = tasksForClient(data, client.id);
  const deals = dealsForClient(data, client.id);
  const appointments = appointmentsForClient(data, client.id);
  const openValue = deals
    .filter((deal) => deal.stage !== 'won' && deal.stage !== 'lost')
    .reduce((total, deal) => total + deal.value, 0);

  function handleDeleteTask(task: FollowUpTask) {
    deleteTask(clinicId, task.id);
    toast.success('Seguimiento eliminado');
  }

  function handleDeleteDeal(deal: Deal) {
    deleteDeal(clinicId, deal.id);
    toast.success('Oportunidad eliminada');
  }

  function handleDeleteAppointment(appointment: CrmAppointment) {
    deleteAppointment(clinicId, appointment.id);
    toast.success('Cita eliminada');
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard/clientes">
          <ArrowLeft />
          Volver a clientes
        </Link>
      </Button>

      {/* Cabecera de la ficha */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={client.name} size="lg" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
                <ClientStatusBadge status={client.status} />
                <ClientSourceBadge source={client.source} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {client.phone ? (
                  <a
                    href={`tel:${client.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Phone className="size-3.5" />
                    {client.phone}
                  </a>
                ) : null}
                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Mail className="size-3.5" />
                    {client.email}
                  </a>
                ) : null}
                {client.company ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {client.company}
                  </span>
                ) : null}
                {client.birthDate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Cake className="size-3.5" />
                    {formatDate(client.birthDate)}
                  </span>
                ) : null}
              </div>
              {client.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map((tag) => (
                    <TagChip key={tag} label={tag} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/dashboard/clientes/${client.id}/editar`}>
                <Pencil />
                Editar
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setTaskDialog({ open: true });
              }}
            >
              <ClipboardList />
              Seguimiento
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setAppointmentDialog({ open: true });
              }}
            >
              <CalendarPlus />
              Cita
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setDealDialog({ open: true });
              }}
            >
              <CircleDollarSign />
              Oportunidad
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Columna lateral: resumen */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Cliente desde</span>
                <span className="font-medium">{formatDate(client.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Último contacto</span>
                <span className="font-medium">
                  {client.lastContactAt ? timeAgo(client.lastContactAt) : 'Sin registrar'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Interacciones</span>
                <span className="font-medium">{activities.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Citas</span>
                <span className="font-medium">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Valor en pipeline</span>
                <span className="font-medium text-primary">{formatCurrency(openValue)}</span>
              </div>
              {client.notes ? (
                <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                  {client.notes}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Próximo seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const next = tasks.find((task) => task.status === 'pending');
                if (!next) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      Sin seguimientos pendientes. ¡Buen momento para programar uno!
                    </p>
                  );
                }
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{next.title}</p>
                    <p
                      className={cn(
                        'text-xs text-muted-foreground',
                        isTaskOverdue(next) && 'font-medium text-rose-600 dark:text-rose-400',
                      )}
                    >
                      {formatRelativeDay(next.dueAt)} · <TaskTypeBadge type={next.type} />
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal con pestañas */}
        <div className="space-y-4">
          <Tabs
            tabs={detailTabs.map((item) => ({
              ...item,
              count:
                item.value === 'seguimientos'
                  ? tasks.filter((task) => task.status === 'pending').length
                  : item.value === 'citas'
                    ? appointments.length
                    : item.value === 'oportunidades'
                      ? deals.length
                      : undefined,
            }))}
            value={tab}
            onChange={setTab}
          />

          {tab === 'actividad' ? (
            <div className="space-y-4">
              <ActivityComposer clinicId={clinicId} clientId={client.id} />

              {activities.length === 0 ? (
                <EmptyState
                  icon={activityKindMeta.note.icon}
                  title="Sin interacciones registradas"
                  description="Cada llamada, mensaje o visita aparecerá aquí para construir el historial del cliente."
                />
              ) : (
                <Card className="border-border/60">
                  <CardContent>
                    <ol className="relative space-y-5 border-l border-border pl-6">
                      {activities.map((activity) => {
                        const meta = activityKindMeta[activity.kind];
                        return (
                          <li key={activity.id} className="relative">
                            <span className="absolute top-0 -left-[31px] flex size-6 items-center justify-center rounded-full border bg-card text-muted-foreground">
                              <meta.icon className="size-3.5" />
                            </span>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <p className="text-sm font-medium">{activity.title}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(activity.createdAt)} · {activity.author}
                              </span>
                            </div>
                            {activity.description ? (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {tab === 'seguimientos' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setTaskDialog({ open: true });
                  }}
                >
                  <Plus />
                  Nuevo seguimiento
                </Button>
              </div>
              {tasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Sin seguimientos"
                  description="Programa llamadas, mensajes o visitas para no perder el contacto."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTaskDialog({ open: true });
                      }}
                    >
                      Crear seguimiento
                    </Button>
                  }
                />
              ) : (
                <Card className="border-border/60">
                  <CardContent className="divide-y divide-border/60">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <button
                          type="button"
                          aria-label={
                            task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada'
                          }
                          className={cn(
                            'mt-0.5 flex size-5 items-center justify-center rounded-full border transition-colors',
                            task.status === 'done'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary',
                          )}
                          onClick={() => {
                            toggleTaskDone(clinicId, task.id);
                          }}
                        >
                          {task.status === 'done' ? (
                            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2.5 6.5 5 9l4.5-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : null}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              task.status === 'done' && 'text-muted-foreground line-through',
                            )}
                          >
                            {task.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <TaskTypeBadge type={task.type} />
                            <TaskPriorityBadge priority={task.priority} />
                            <span
                              className={cn(
                                isTaskOverdue(task) &&
                                  'font-medium text-rose-600 dark:text-rose-400',
                              )}
                            >
                              {task.status === 'done'
                                ? `Completada ${task.completedAt ? timeAgo(task.completedAt) : ''}`
                                : `Vence ${formatRelativeDay(task.dueAt)}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Editar seguimiento"
                            onClick={() => {
                              setTaskDialog({ open: true, task });
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar seguimiento"
                            onClick={() => {
                              handleDeleteTask(task);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {tab === 'citas' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setAppointmentDialog({ open: true });
                  }}
                >
                  <Plus />
                  Nueva cita
                </Button>
              </div>
              {appointments.length === 0 ? (
                <EmptyState
                  icon={CalendarPlus}
                  title="Sin citas"
                  description="Agenda la primera cita de este cliente desde aquí."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAppointmentDialog({ open: true });
                      }}
                    >
                      Agendar cita
                    </Button>
                  }
                />
              ) : (
                <Card className="border-border/60">
                  <CardContent className="divide-y divide-border/60">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <span className="text-[10px] leading-none">
                            {formatDate(appointment.startsAt).split(' ')[1]}
                          </span>
                          <span className="text-sm leading-tight font-semibold">
                            {new Date(appointment.startsAt).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{appointment.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <AppointmentStatusBadge status={appointment.status} />
                            <span>
                              {formatDateTime(appointment.startsAt)} →{' '}
                              {new Date(appointment.endsAt).toLocaleTimeString('es', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {appointment.notes ? (
                            <p className="mt-1 text-xs text-muted-foreground">{appointment.notes}</p>
                          ) : null}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Editar cita"
                            onClick={() => {
                              setAppointmentDialog({ open: true, appointment });
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar cita"
                            onClick={() => {
                              handleDeleteAppointment(appointment);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {tab === 'oportunidades' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDealDialog({ open: true });
                  }}
                >
                  <Plus />
                  Nueva oportunidad
                </Button>
              </div>
              {deals.length === 0 ? (
                <EmptyState
                  icon={CircleDollarSign}
                  title="Sin oportunidades"
                  description="Registra ventas potenciales para medir el valor de este cliente."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDealDialog({ open: true });
                      }}
                    >
                      Crear oportunidad
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {deals.map((deal) => (
                    <Card key={deal.id} className="border-border/60">
                      <CardContent className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{deal.title}</p>
                          <DealStageBadge stage={deal.stage} />
                        </div>
                        <p className="text-xl font-bold tracking-tight">{formatCurrency(deal.value)}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Prob. {deal.probability}%</span>
                          {deal.expectedCloseAt ? (
                            <span>· Cierre {formatDate(deal.expectedCloseAt)}</span>
                          ) : null}
                          <span
                            className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
                            aria-hidden="true"
                          >
                            <span
                              className={cn('block h-full rounded-full', dealStageMeta[deal.stage].barClass)}
                              style={{ width: `${deal.probability}%` }}
                            />
                          </span>
                        </div>
                        <div className="flex justify-end gap-1 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDealDialog({ open: true, deal });
                            }}
                          >
                            <Pencil />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleDeleteDeal(deal);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) => setTaskDialog((prev) => ({ ...prev, open }))}
        clinicId={clinicId}
        clients={[client]}
        task={taskDialog.task}
        defaultClientId={client.id}
      />
      <DealDialog
        open={dealDialog.open}
        onOpenChange={(open) => setDealDialog((prev) => ({ ...prev, open }))}
        clinicId={clinicId}
        clients={[client]}
        deal={dealDialog.deal}
        defaultClientId={client.id}
      />
      <AppointmentDialog
        open={appointmentDialog.open}
        onOpenChange={(open) => setAppointmentDialog((prev) => ({ ...prev, open }))}
        clinicId={clinicId}
        clients={[client]}
        appointment={appointmentDialog.appointment}
        defaultClientId={client.id}
      />
    </div>
  );
}

export { ClientDetailPage };
