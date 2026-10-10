import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useUpdateBusinessSettings } from '@/features/business/hooks';
import { CURRENCY_OPTIONS, DAY_KEYS, DAY_LABELS, TIMEZONE_OPTIONS } from '@/features/business/labels';
import {
  businessSettingsFormSchema,
  toBusinessSettingsPayload,
  type BusinessSettingsFormValues,
} from '@/features/business/schemas';
import { CheckboxField, SelectField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { BusinessSettings, DayKey } from '@/types';

/** Reglas de agenda y horario (`PUT /business/settings`). */
function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const update = useUpdateBusinessSettings();

  const workingHours = Object.fromEntries(
    DAY_KEYS.map((day) => {
      const hours = settings.working_hours[day];
      return [
        day,
        {
          open: hours?.open?.slice(0, 5) || '09:00',
          close: hours?.close?.slice(0, 5) || '18:00',
          closed: hours?.closed ?? false,
        },
      ];
    }),
  ) as BusinessSettingsFormValues['workingHours'];

  const form = useAppForm<BusinessSettingsFormValues>({
    schema: businessSettingsFormSchema,
    defaultValues: {
      timezone: settings.timezone,
      appointmentDurationMinutes: String(settings.appointment_duration_minutes),
      slotIntervalMinutes: String(settings.slot_interval_minutes ?? 15),
      minNoticeMinutes: String(settings.min_notice_minutes ?? 60),
      maxAdvanceDays: String(settings.max_advance_days ?? 60),
      autoConfirm: settings.auto_confirm_appointments ?? false,
      allowOnlineBooking: settings.allow_online_booking ?? false,
      currency: settings.currency ?? 'MXN',
      workingHours,
    },
    onSubmit: async (values) => {
      try {
        await update.mutateAsync(toBusinessSettingsPayload(values));
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
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Agenda</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field name="timezone">
            {(field) => <SelectField field={field} label="Zona horaria" options={TIMEZONE_OPTIONS} />}
          </form.Field>
          <form.Field name="currency">
            {(field) => <SelectField field={field} label="Moneda" options={CURRENCY_OPTIONS} />}
          </form.Field>
          <form.Field name="appointmentDurationMinutes">
            {(field) => (
              <TextField field={field} label="Duración de cita (minutos)" inputMode="numeric" hint="Entre 5 y 480." />
            )}
          </form.Field>
          <form.Field name="slotIntervalMinutes">
            {(field) => (
              <TextField field={field} label="Intervalo entre horarios (minutos)" inputMode="numeric" hint="Entre 5 y 240." />
            )}
          </form.Field>
          <form.Field name="minNoticeMinutes">
            {(field) => (
              <TextField field={field} label="Aviso mínimo (minutos)" inputMode="numeric" hint="Entre 0 y 10080." />
            )}
          </form.Field>
          <form.Field name="maxAdvanceDays">
            {(field) => (
              <TextField field={field} label="Días máximos de anticipación" inputMode="numeric" hint="Entre 1 y 365." />
            )}
          </form.Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="autoConfirm">
            {(field) => (
              <CheckboxField
                field={field}
                label="Confirmar automáticamente las citas"
                description="Las citas nuevas pasan directo a confirmadas."
              />
            )}
          </form.Field>
          <form.Field name="allowOnlineBooking">
            {(field) => (
              <CheckboxField field={field} label="Permitir reservas en línea" description="Habilita la agenda pública." />
            )}
          </form.Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Horario de atención</h2>
        <div className="space-y-3">
          {DAY_KEYS.map((day: DayKey) => (
            <DayRow key={day} day={day} form={form} />
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {isSubmitting || update.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Guardar configuración
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

/** Fila de un día: apertura, cierre y bandera de día cerrado. */
function DayRow({ day, form }: { day: DayKey; form: FormLike }) {
  return (
    <form.Subscribe selector={(state) => state.values.workingHours[day].closed}>
      {(closed) => (
        <div className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]">
          <p className="pb-2 text-sm font-medium">{DAY_LABELS[day]}</p>
          <form.Field name={`workingHours.${day}.open` as const}>
            {(field) => <TextField field={field} label="Apertura" type="time" disabled={closed} />}
          </form.Field>
          <form.Field name={`workingHours.${day}.close` as const}>
            {(field) => <TextField field={field} label="Cierre" type="time" disabled={closed} />}
          </form.Field>
          <form.Field name={`workingHours.${day}.closed` as const}>
            {(field) => <CheckboxField field={field} label="Cerrado" className="pb-2" />}
          </form.Field>
        </div>
      )}
    </form.Subscribe>
  );
}

/** Tipo mínimo del formulario que necesita `DayRow` (evita repetir el genérico completo). */
type FormLike = ReturnType<typeof useAppForm<BusinessSettingsFormValues>>;

export { BusinessSettingsForm };
