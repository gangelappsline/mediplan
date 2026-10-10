import { ArrowLeft, CalendarDays, CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AppointmentFormDialog } from '@/features/business/components/AppointmentFormDialog';
import { AppointmentRow } from '@/features/business/components/AppointmentRow';
import { useAppointments, useClient, useDeleteClient } from '@/features/business/hooks';
import { LinkButton } from '@/shared/components/LinkButton';
import { Avatar } from '@/shared/components/Avatar';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDate } from '@/shared/lib/format';

export function ClientDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const client = useClient(id);
  const appointments = useAppointments({ client_id: id, per_page: 10 });
  const remove = useDeleteClient();
  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-6">
      <Link to="/dashboard/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a clientes
      </Link>

      <QueryBoundary isLoading={client.isLoading} error={client.error} onRetry={() => void client.refetch()}>
        {client.data ? (
          <>
            <PageHeader
              title={client.data.name}
              description={client.data.email ?? client.data.phone ?? 'Sin datos de contacto'}
              actions={
                <>
                  <Button onClick={() => setCreating(true)}>
                    <CalendarPlus />
                    Agendar cita
                  </Button>
                  <LinkButton to={`/dashboard/clientes/${id}/editar`} variant="outline">
                    <Pencil />
                    Editar
                  </LinkButton>
                  <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 />
                    Eliminar
                  </Button>
                </>
              }
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Avatar name={client.data.name} />
                    <StatusBadge name={client.data.status.name} label={client.data.status.label} />
                  </div>
                  <Info label="Correo" value={client.data.email} />
                  <Info label="Teléfono" value={client.data.phone} />
                  <Info label="Nacimiento" value={client.data.birth_date ? formatDate(client.data.birth_date) : null} />
                  <Info label="Citas" value={String(client.data.appointments_count ?? 0)} />
                  <Info label="Notas" value={client.data.notes} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Últimas citas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <QueryBoundary
                    isLoading={appointments.isLoading}
                    error={appointments.error}
                    onRetry={() => void appointments.refetch()}
                    isEmpty={appointments.data?.data.length === 0}
                    emptyState={
                      <EmptyState icon={CalendarDays} title="Sin citas todavía" description="Agenda la primera cita para este cliente." />
                    }
                  >
                    {appointments.data?.data
                      .filter((appointment) => !appointment.client || appointment.client.id === id)
                      .map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} />)}
                  </QueryBoundary>
                </CardContent>
              </Card>
            </div>

            <AppointmentFormDialog open={creating} onOpenChange={setCreating} defaultClientId={id} />
            <ConfirmDialog
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
              title="¿Eliminar este cliente?"
              description="Se eliminará la ficha del cliente. Esta acción no se puede deshacer."
              confirmLabel="Eliminar cliente"
              isPending={remove.isPending}
              onConfirm={() => remove.mutate(id, { onSuccess: () => navigate('/dashboard/clientes', { replace: true }) })}
            />
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-line">{value || '—'}</p>
    </div>
  );
}
