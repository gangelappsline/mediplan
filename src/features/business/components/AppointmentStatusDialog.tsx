import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useUpdateAppointmentStatus } from '@/features/business/hooks';
import { APPOINTMENT_STATUS_LABEL } from '@/features/business/labels';
import {
  appointmentStatusFormSchema,
  toAppointmentStatusPayload,
  type AppointmentStatusFormValues,
} from '@/features/business/schemas';
import { SelectField, TextAreaField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { Appointment } from '@/types';

const TRANSITION_OPTIONS = [
  { value: 'confirmed', label: APPOINTMENT_STATUS_LABEL.confirmed },
  { value: 'completed', label: APPOINTMENT_STATUS_LABEL.completed },
  { value: 'no_show', label: APPOINTMENT_STATUS_LABEL.no_show },
  { value: 'cancelled', label: APPOINTMENT_STATUS_LABEL.cancelled },
] as const;

interface AppointmentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}

/** Cambio de estado (`PATCH /business/appointments/{id}/status`). Cancelar exige motivo. */
function AppointmentStatusDialog({ open, onOpenChange, appointment }: AppointmentStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Cambiar estado de la cita" description={appointment.title}>
      {open ? <StatusForm appointment={appointment} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function StatusForm({
  appointment,
  onDone,
  onCancel,
}: {
  appointment: Appointment;
  onDone: () => void;
  onCancel: () => void;
}) {
  const update = useUpdateAppointmentStatus();
  const current = appointment.status.name;
  const initialStatus = TRANSITION_OPTIONS.some((o) => o.value === current) && current !== 'cancelled'
    ? (current as AppointmentStatusFormValues['status'])
    : 'confirmed';

  const form = useAppForm<AppointmentStatusFormValues>({
    schema: appointmentStatusFormSchema,
    defaultValues: { status: initialStatus, cancelReason: '' },
    onSubmit: async (values) => {
      try {
        await update.mutateAsync({ id: appointment.id, payload: toAppointmentStatusPayload(values) });
        onDone();
      } catch {
        // Notificado por el hook de mutación.
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-sm text-muted-foreground">
        Estado actual: <strong className="text-foreground">{appointment.status.label}</strong>
      </p>
      <form.Field name="status">
        {(field) => <SelectField field={field} label="Nuevo estado" options={TRANSITION_OPTIONS} />}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.status}>
        {(status) =>
          status === 'cancelled' ? (
            <form.Field name="cancelReason">
              {(field) => (
                <TextAreaField field={field} label="Motivo de cancelación" required rows={3} maxLength={255} />
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {isSubmitting || update.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Guardar estado
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export { AppointmentStatusDialog };
