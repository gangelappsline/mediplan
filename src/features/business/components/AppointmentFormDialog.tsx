import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useClients, useSaveAppointment } from '@/features/business/hooks';
import {
  appointmentFormSchema,
  emptyAppointmentForm,
  toAppointmentPayload,
  type AppointmentFormValues,
} from '@/features/business/schemas';
import { SelectField, TextAreaField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { toDateTimeLocalValue } from '@/shared/lib/format';
import type { Appointment } from '@/types';

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
  /** Inicio sugerido (`AAAA-MM-DDTHH:mm`), p. ej. al hacer clic en un día de la agenda. */
  defaultStart?: string;
  /** Cliente preseleccionado (p. ej. desde la ficha de cliente). */
  defaultClientId?: number;
  onSaved?: () => void;
}

/**
 * Alta y edición de citas (`POST` / `PUT /business/appointments`).
 * Al editar, el estado se cambia con `PATCH /business/appointments/{id}/status`,
 * por eso no se envía `status` en el `PUT`.
 */
function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  defaultStart,
  defaultClientId,
  onSaved,
}: AppointmentFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={appointment ? 'Editar cita' : 'Nueva cita'}
      description="Las citas no pueden traslaparse con otras del negocio."
      className="max-w-2xl"
    >
      {open ? (
        <AppointmentForm
          appointment={appointment}
          defaultStart={defaultStart}
          defaultClientId={defaultClientId}
          onCancel={() => onOpenChange(false)}
          onSaved={() => {
            onOpenChange(false);
            onSaved?.();
          }}
        />
      ) : null}
    </Dialog>
  );
}

interface AppointmentFormProps {
  appointment?: Appointment;
  defaultStart?: string;
  defaultClientId?: number;
  onCancel: () => void;
  onSaved: () => void;
}

function AppointmentForm({ appointment, defaultStart, defaultClientId, onCancel, onSaved }: AppointmentFormProps) {
  const save = useSaveAppointment(appointment?.id);
  const clients = useClients({ sort: 'name', direction: 'asc', per_page: 100 });

  const clientOptions = (clients.data?.data ?? []).map((client) => ({ value: String(client.id), label: client.name }));
  // Si la cita apunta a un cliente que no está en la primera página, lo añadimos a las opciones.
  if (appointment?.client && !clientOptions.some((o) => o.value === String(appointment.client?.id))) {
    clientOptions.unshift({ value: String(appointment.client.id), label: appointment.client.name });
  }

  const defaults: AppointmentFormValues = appointment
    ? {
        clientId: appointment.client ? String(appointment.client.id) : '',
        title: appointment.title,
        description: appointment.description ?? '',
        startsAt: toDateTimeLocalValue(appointment.starts_at),
        endsAt: toDateTimeLocalValue(appointment.ends_at),
        status: appointment.status.name === 'confirmed' ? 'confirmed' : 'scheduled',
        price: appointment.price !== null ? String(appointment.price) : '',
      }
    : {
        ...emptyAppointmentForm(defaultClientId ? String(defaultClientId) : ''),
        startsAt: defaultStart ?? '',
        endsAt: defaultStart ? addMinutesToLocal(defaultStart, 60) : '',
      };

  const form = useAppForm<AppointmentFormValues>({
    schema: appointmentFormSchema,
    defaultValues: defaults,
    onSubmit: async (values) => {
      const payload = toAppointmentPayload(values);
      try {
        if (appointment) {
          // El estado se gestiona con su propio endpoint en modo edición.
          const { status: _status, ...updatePayload } = payload;
          void _status;
          await save.mutateAsync(updatePayload);
        } else {
          await save.mutateAsync(payload);
        }
        onSaved();
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
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field name="clientId">
          {(field) => (
            <SelectField
              field={field}
              label="Cliente"
              required
              options={clientOptions}
              placeholder={clients.isLoading ? 'Cargando clientes…' : 'Selecciona un cliente'}
            />
          )}
        </form.Field>
        <form.Field name="title">
          {(field) => <TextField field={field} label="Título" required maxLength={255} placeholder="Consulta inicial" />}
        </form.Field>
        <form.Field name="startsAt">
          {(field) => <TextField field={field} label="Inicio" type="datetime-local" required />}
        </form.Field>
        <form.Field name="endsAt">
          {(field) => <TextField field={field} label="Fin" type="datetime-local" required />}
        </form.Field>
        {appointment ? null : (
          <form.Field name="status">
            {(field) => (
              <SelectField
                field={field}
                label="Estado inicial"
                options={[
                  { value: 'scheduled', label: 'Agendada' },
                  { value: 'confirmed', label: 'Confirmada' },
                ]}
              />
            )}
          </form.Field>
        )}
        <form.Field name="price">
          {(field) => <TextField field={field} label="Precio (opcional)" inputMode="decimal" placeholder="0.00" />}
        </form.Field>
      </div>
      <form.Field name="description">
        {(field) => <TextAreaField field={field} label="Descripción" rows={3} />}
      </form.Field>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || save.isPending}>
              {isSubmitting || save.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {appointment ? 'Guardar cambios' : 'Agendar cita'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

/** Suma minutos a un valor `datetime-local` sin depender de la zona horaria. */
function addMinutesToLocal(value: string, minutes: number): string {
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm + minutes));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export { AppointmentFormDialog };
