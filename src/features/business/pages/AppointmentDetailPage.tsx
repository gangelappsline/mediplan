import { ArrowLeft, Pencil, Trash2, UserRound, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AppointmentFormDialog } from '@/features/business/components/AppointmentFormDialog';
import { AppointmentStatusDialog } from '@/features/business/components/AppointmentStatusDialog';
import { useAppointment, useDeleteAppointment } from '@/features/business/hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDateTime, formatMoney } from '@/shared/lib/format';

export function AppointmentDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const query = useAppointment(id);
  const remove = useDeleteAppointment();
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-6">
      <Link to="/dashboard/agenda" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a la agenda
      </Link>

      <QueryBoundary isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
        {query.data ? (
          <>
            <PageHeader
              title={query.data.title}
              description={`${formatDateTime(query.data.starts_at)} – ${formatDateTime(query.data.ends_at)}`}
              actions={
                <>
                  <Button variant="outline" onClick={() => setChangingStatus(true)}>
                    <ArrowRightLeft />
                    Cambiar estado
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Pencil />
                    Editar
                  </Button>
                  <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 />
                    Eliminar
                  </Button>
                </>
              }
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge name={query.data.status.name} label={query.data.status.label} />
                    {query.data.price !== null ? (
                      <span className="text-muted-foreground">Precio: {formatMoney(query.data.price)}</span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Descripción</p>
                    <p className="whitespace-pre-line">{query.data.description || 'Sin descripción.'}</p>
                  </div>
                  {query.data.cancelled_at ? (
                    <div className="rounded-lg bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300">
                      <p className="font-medium">Cancelada el {formatDateTime(query.data.cancelled_at)}</p>
                      {query.data.cancel_reason ? <p>Motivo: {query.data.cancel_reason}</p> : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {query.data.client ? (
                    <>
                      <p className="flex items-center gap-2 font-medium">
                        <UserRound className="size-4 text-muted-foreground" /> {query.data.client.name}
                      </p>
                      {query.data.client.email ? <p className="text-muted-foreground">{query.data.client.email}</p> : null}
                      {query.data.client.phone ? <p className="text-muted-foreground">{query.data.client.phone}</p> : null}
                      <Link to={`/dashboard/clientes/${query.data.client.id}`} className="text-primary hover:underline">
                        Ver ficha del cliente
                      </Link>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Sin cliente asociado.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <AppointmentFormDialog open={editing} onOpenChange={setEditing} appointment={query.data} />
            <AppointmentStatusDialog open={changingStatus} onOpenChange={setChangingStatus} appointment={query.data} />
            <ConfirmDialog
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
              title="¿Eliminar esta cita?"
              description="Esta acción no se puede deshacer."
              confirmLabel="Eliminar cita"
              isPending={remove.isPending}
              onConfirm={() =>
                remove.mutate(id, {
                  onSuccess: () => navigate('/dashboard/agenda', { replace: true }),
                })
              }
            />
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}
