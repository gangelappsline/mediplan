import { Ban, CalendarPlus, CalendarDays, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { AppointmentDialog } from '@/features/crm/components/AppointmentDialog';
import { AppointmentStatusBadge } from '@/features/crm/components/Badges';
import { StatCard } from '@/features/crm/components/StatCard';
import { formatDate, formatRelativeDay, formatTime } from '@/features/crm/format';
import { crmIcons } from '@/features/crm/labels';
import { useCrm } from '@/features/crm/hooks/useCrm';
import {
  appointmentsThisWeek,
  clientName,
  pastAppointments,
  upcomingAppointments,
} from '@/features/crm/selectors';
import { deleteAppointment, setAppointmentStatus } from '@/features/crm/storage';
import type { CrmAppointment } from '@/features/crm/types';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs } from '@/shared/components/ui/tabs';
import { PageHeader } from '@/shared/components/PageHeader';

type AgendaView = 'proximas' | 'pasadas';

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/** Agenda de citas: vista de próximas y pasadas, agrupadas por día. */
function AgendaPage() {
  const { clinicId, data } = useCrm();
  const [view, setView] = useState<AgendaView>('proximas');
  const [dialog, setDialog] = useState<{ open: boolean; appointment?: CrmAppointment }>({
    open: false,
  });

  const upcoming = upcomingAppointments(data);
  const past = pastAppointments(data);
  const thisWeek = appointmentsThisWeek(data);

  const visible = view === 'proximas' ? upcoming : past;

  const groups = useMemo(() => {
    const map = new Map<string, CrmAppointment[]>();
    for (const appointment of visible) {
      const key = dayKey(appointment.startsAt);
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Citas de tus clientes con estado, horario y notas. Todo conectado con la ficha de cada cliente."
        actions={
          <Button
            type="button"
            onClick={() => {
              setDialog({ open: true });
            }}
          >
            <CalendarPlus />
            Nueva cita
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Próximas citas"
          value={upcoming.length}
          hint="Agendadas y confirmadas"
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          title="Esta semana"
          value={thisWeek.length}
          hint="En los próximos 7 días"
          icon={crmIcons.clock}
          tone="info"
        />
        <StatCard
          title="Citas completadas"
          value={data.appointments.filter((item) => item.status === 'completed').length}
          hint="Histórico"
          icon={crmIcons.heart}
          tone="success"
        />
      </div>

      <Tabs
        tabs={[
          { value: 'proximas', label: 'Próximas', count: upcoming.length },
          { value: 'pasadas', label: 'Pasadas', count: past.length },
        ]}
        value={view}
        onChange={(value) => {
          setView(value as AgendaView);
        }}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={view === 'proximas' ? 'No hay citas próximas' : 'No hay citas anteriores'}
          description={
            view === 'proximas'
              ? 'Agenda una cita para un cliente y aparecerá organizada por día.'
              : 'Las citas completadas y canceladas se archivarán aquí.'
          }
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialog({ open: true });
              }}
            >
              <Plus />
              Agendar cita
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([key, items]) => (
            <section key={key} aria-label={key}>
              <h2 className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                <span className="capitalize">{formatRelativeDay(items[0].startsAt)}</span>
                <span className="font-normal text-muted-foreground">
                  {formatDate(items[0].startsAt)}
                </span>
              </h2>
              <Card className="border-border/60">
                <CardContent className="divide-y divide-border/60">
                  {items.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-wrap items-start gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="w-24 shrink-0">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatTime(appointment.startsAt)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          → {formatTime(appointment.endsAt)}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{appointment.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <Link
                            to={`/dashboard/clientes/${appointment.clientId}`}
                            className="font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {clientName(data, appointment.clientId)}
                          </Link>
                          <AppointmentStatusBadge status={appointment.status} />
                        </div>
                        {appointment.notes ? (
                          <p className="mt-1 text-xs text-muted-foreground">{appointment.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex gap-1">
                        {appointment.status === 'scheduled' || appointment.status === 'confirmed' ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Marcar como completada"
                              onClick={() => {
                                setAppointmentStatus(clinicId, appointment.id, 'completed');
                                toast.success('Cita marcada como completada');
                              }}
                            >
                              <Check />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Cancelar cita"
                              onClick={() => {
                                setAppointmentStatus(clinicId, appointment.id, 'cancelled');
                                toast.success('Cita cancelada');
                              }}
                            >
                              <Ban />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Editar cita"
                          onClick={() => {
                            setDialog({ open: true, appointment });
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
                            deleteAppointment(clinicId, appointment.id);
                            toast.success('Cita eliminada');
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}

      <AppointmentDialog
        open={dialog.open}
        onOpenChange={(open) => {
          setDialog((prev) => ({ ...prev, open }));
        }}
        clinicId={clinicId}
        clients={data.clients}
        appointment={dialog.appointment}
      />
    </div>
  );
}

export { AgendaPage };
