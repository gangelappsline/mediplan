import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { AppointmentFormDialog } from '@/features/business/components/AppointmentFormDialog';
import { AppointmentRow } from '@/features/business/components/AppointmentRow';
import { useAgenda, useAppointments } from '@/features/business/hooks';
import { APPOINTMENT_STATUS_OPTIONS } from '@/features/business/labels';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { formatDate, formatDateTime, formatWeekday, shiftDateValue, todayDateValue } from '@/shared/lib/format';
import type { AppointmentStatusName } from '@/types';

type View = 'week' | 'list';

export function AgendaPage() {
  const [view, setView] = useState<View>('week');
  const [start, setStart] = useState(todayDateValue());
  const [dialog, setDialog] = useState<{ open: boolean; defaultStart?: string }>({ open: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Organiza tus citas por semana o consulta el listado completo."
        actions={
          <Button onClick={() => setDialog({ open: true })}>
            <Plus />
            Nueva cita
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border p-1">
            <ToggleButton active={view === 'week'} onClick={() => setView('week')}>
              Semana
            </ToggleButton>
            <ToggleButton active={view === 'list'} onClick={() => setView('list')}>
              Listado
            </ToggleButton>
          </div>
        </div>
      </PageHeader>

      {view === 'week' ? (
        <WeekView
          start={start}
          onShift={(days) => setStart(shiftDateValue(start, days))}
          onToday={() => setStart(todayDateValue())}
          onCreateAt={(defaultStart) => setDialog({ open: true, defaultStart })}
        />
      ) : (
        <AppointmentList />
      )}

      <AppointmentFormDialog
        open={dialog.open}
        defaultStart={dialog.defaultStart}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

/** Vista semanal: `GET /business/appointments/agenda?from&to` (7 días). */
function WeekView({
  start,
  onShift,
  onToday,
  onCreateAt,
}: {
  start: string;
  onShift: (days: number) => void;
  onToday: () => void;
  onCreateAt: (defaultStart: string) => void;
}) {
  const end = shiftDateValue(start, 6);
  const agenda = useAgenda(start, end);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onShift(-7)} aria-label="Semana anterior">
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={onToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={() => onShift(7)} aria-label="Semana siguiente">
            <ChevronRight />
          </Button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {formatDate(start)} – {formatDate(end)}
          {agenda.data ? ` · ${agenda.data.total} citas` : ''}
        </p>
      </div>

      <QueryBoundary isLoading={agenda.isLoading} error={agenda.error} onRetry={() => void agenda.refetch()}>
        {agenda.data ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {agenda.data.days.map((day) => (
              <Card key={day.date} className={day.date === todayDateValue() ? 'border-primary/50' : undefined}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base capitalize">{formatWeekday(day.date)}</CardTitle>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCreateAt(`${day.date}T09:00`)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Agendar en ${formatDate(day.date)}`}
                  >
                    <CalendarPlus className="size-4" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {day.appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin citas</p>
                  ) : (
                    day.appointments.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} />)
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </QueryBoundary>
    </div>
  );
}

const STATUS_FILTER_ALL = 'all';

/** Listado paginado: `GET /business/appointments` con filtro por estado. */
function AppointmentList() {
  const [status, setStatus] = useState<AppointmentStatusName | typeof STATUS_FILTER_ALL>(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const appointments = useAppointments({
    status: status === STATUS_FILTER_ALL ? '' : status,
    page,
    per_page: 15,
  });

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_auto]">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Estado</p>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as AppointmentStatusName | typeof STATUS_FILTER_ALL);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>Todos</SelectItem>
                {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
              <Plus />
              Nueva cita
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <QueryBoundary
          isLoading={appointments.isLoading}
          error={appointments.error}
          onRetry={() => void appointments.refetch()}
          isEmpty={appointments.data?.data.length === 0}
          emptyState={
            <EmptyState
              icon={CalendarDays}
              title="No hay citas con este filtro"
              description="Cambia el estado o agenda una cita nueva."
            />
          }
        >
          <div className="space-y-2">
            {appointments.data?.data.map((appointment) => (
              <div key={appointment.id} className="flex flex-col gap-1">
                <AppointmentRow appointment={appointment} />
                <p className="px-1 text-xs text-muted-foreground">
                  {formatDateTime(appointment.starts_at)}
                  {appointment.price !== null ? ` · $${appointment.price}` : ''}
                  {appointment.cancel_reason ? ` · Motivo: ${appointment.cancel_reason}` : ''}
                </p>
              </div>
            ))}
          </div>
          <Pagination meta={appointments.data?.meta} onPageChange={setPage} />
        </QueryBoundary>
      </CardContent>
      <AppointmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}
