import { LoaderCircle } from 'lucide-react';
import { type FormEvent } from 'react';
import { toast } from 'sonner';

import { ClientSelect } from '@/features/crm/components/ClientSelect';
import { toDateTimeLocalValue } from '@/features/crm/format';
import { appointmentStatusMeta } from '@/features/crm/labels';
import {
  appointmentEndFieldSchema,
  appointmentFormSchema,
  appointmentStartFieldSchema,
  appointmentStatusFieldSchema,
  appointmentTitleFieldSchema,
  type AppointmentFormValues,
} from '@/features/crm/schemas';
import { createAppointment, updateAppointment } from '@/features/crm/storage';
import type { AppointmentStatus, Client, CrmAppointment } from '@/features/crm/types';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppForm } from '@/shared/hooks/useAppForm';

function defaultStartValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toDateTimeLocalValue(date.toISOString());
}

function defaultEndValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(11, 0, 0, 0);
  return toDateTimeLocalValue(date.toISOString());
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clients: readonly Client[];
  /** Si se pasa, el diálogo edita esa cita; si no, crea una nueva. */
  appointment?: CrmAppointment;
  defaultClientId?: string;
}

/** Diálogo de alta/edición de una cita de la agenda. */
function AppointmentDialog({
  open,
  onOpenChange,
  clinicId,
  clients,
  appointment,
  defaultClientId,
}: AppointmentDialogProps) {
  const form = useAppForm<AppointmentFormValues>({
    schema: appointmentFormSchema,
    defaultValues: {
      clientId: appointment?.clientId ?? defaultClientId ?? '',
      title: appointment?.title ?? '',
      startsAt: appointment ? toDateTimeLocalValue(appointment.startsAt) : defaultStartValue(),
      endsAt: appointment ? toDateTimeLocalValue(appointment.endsAt) : defaultEndValue(),
      status: appointment?.status ?? 'scheduled',
      notes: appointment?.notes ?? '',
    },
    onSubmit: (values) => {
      try {
        if (appointment) {
          updateAppointment(clinicId, appointment.id, values);
          toast.success('Cita actualizada');
        } else {
          createAppointment(clinicId, values);
          toast.success('Cita agendada');
        }
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar la cita');
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={appointment ? 'Editar cita' : 'Nueva cita'}
      description="Agenda una cita con un cliente y mantén el control de su estado."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <form.Field name="clientId" validators={{ onChange: appointmentFormSchema.shape.clientId }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Cliente</Label>
              <ClientSelect
                id={field.name}
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value);
                }}
                clients={clients}
                ariaInvalid={!field.state.meta.isValid}
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="title" validators={{ onChange: appointmentTitleFieldSchema }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Motivo de la cita</Label>
              <Input
                id={field.name}
                placeholder="Ej. Control de ortodoncia"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="startsAt" validators={{ onChange: appointmentStartFieldSchema }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Inicio</Label>
                <Input
                  id={field.name}
                  type="datetime-local"
                  value={field.state.value}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={!field.state.meta.isValid}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="endsAt" validators={{ onChange: appointmentEndFieldSchema }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Fin</Label>
                <Input
                  id={field.name}
                  type="datetime-local"
                  value={field.state.value}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={!field.state.meta.isValid}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="status" validators={{ onChange: appointmentStatusFieldSchema }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Estado</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) => {
                  field.handleChange(value as AppointmentStatus);
                }}
              >
                <SelectTrigger id={field.name} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(appointmentStatusMeta) as AppointmentStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {appointmentStatusMeta[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="notes" validators={{ onChange: appointmentFormSchema.shape.notes }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Notas <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id={field.name}
                rows={3}
                placeholder="Indicaciones para la cita…"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
              />
            </div>
          )}
        </form.Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
                {appointment ? 'Guardar cambios' : 'Agendar cita'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Dialog>
  );
}

export { AppointmentDialog, type AppointmentDialogProps };
