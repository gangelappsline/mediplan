import { ArrowLeft, Ban, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useCancelAppointment, useClientAppointment } from '@/features/cliente/hooks';
import { TextAreaField } from '@/shared/components/form/Fields';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog } from '@/shared/components/ui/dialog';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { formatDateTime, formatMoney } from '@/shared/lib/format';
import type { Appointment } from '@/types';

const CANCELLABLE = new Set(['scheduled', 'confirmed']);

const cancelSchema = z.object({
  reason: z.string().max(255, 'Máximo 255 caracteres'),
});

export function MyAppointmentDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const query = useClientAppointment(id);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Link to="/cuenta/citas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a mis citas
      </Link>

      <QueryBoundary isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
        {query.data ? (
          <>
            <PageHeader
              title={query.data.title}
              description={`${formatDateTime(query.data.starts_at)} – ${formatDateTime(query.data.ends_at)}`}
              actions={
                CANCELLABLE.has(query.data.status.name) ? (
                  <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                    <Ban />
                    Cancelar cita
                  </Button>
                ) : null
              }
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <StatusBadge name={query.data.status.name} label={query.data.status.label} />
                  {query.data.price !== null ? <p>Precio: {formatMoney(query.data.price)}</p> : null}
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
                  <CardTitle>Negocio</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">{query.data.business?.name ?? 'Sin dato'}</p>
                </CardContent>
              </Card>
            </div>

            <CancelDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              appointment={query.data}
            />
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}

/** Cancelación por el cliente (`PATCH /client/appointments/{id}/cancel`). El motivo es opcional. */
function CancelDialog({
  open,
  onOpenChange,
  appointment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="¿Cancelar esta cita?" description="Puedes indicar un motivo (opcional).">
      {open ? <CancelForm appointment={appointment} onCancel={() => onOpenChange(false)} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function CancelForm({ appointment, onCancel, onDone }: { appointment: Appointment; onCancel: () => void; onDone: () => void }) {
  const cancel = useCancelAppointment(appointment.id);

  const form = useAppForm({
    schema: cancelSchema,
    defaultValues: { reason: '' },
    onSubmit: async (values) => {
      try {
        await cancel.mutateAsync({ cancel_reason: values.reason.trim() || null });
        onDone();
      } catch {
        // Notificado por el hook.
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <form.Field name="reason">
        {(field) => <TextAreaField field={field} label="Motivo (opcional)" rows={3} maxLength={255} />}
      </form.Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Volver
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" variant="destructive" disabled={isSubmitting || cancel.isPending}>
              {isSubmitting || cancel.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Confirmar cancelación
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

