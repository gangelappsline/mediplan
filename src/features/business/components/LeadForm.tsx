import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useSaveLead } from '@/features/business/hooks';
import { LEAD_SOURCE_OPTIONS, LEAD_STATUS_OPTIONS } from '@/features/business/labels';
import { emptyLeadForm, leadFormSchema, toLeadPayload, type LeadFormValues } from '@/features/business/schemas';
import { SelectField, TextAreaField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { toDateTimeLocalValue } from '@/shared/lib/format';
import type { Lead } from '@/types';

interface LeadFormProps {
  lead?: Lead;
  onSaved: (lead: Lead) => void;
  onCancel?: () => void;
}

/** Alta y edición de leads (`POST` / `PUT /business/leads`). Requiere correo o teléfono. */
function LeadForm({ lead, onSaved, onCancel }: LeadFormProps) {
  const save = useSaveLead(lead?.id);

  const form = useAppForm<LeadFormValues>({
    schema: leadFormSchema,
    defaultValues: lead
      ? {
          name: lead.name,
          email: lead.email ?? '',
          phone: lead.phone ?? '',
          company: lead.company ?? '',
          source: lead.source ?? '',
          status: lead.status.name as LeadFormValues['status'],
          estimatedValue: lead.estimated_value !== null ? String(lead.estimated_value) : '',
          assignedToUserId: lead.assigned_to ? String(lead.assigned_to.id) : '',
          followUpAt: lead.follow_up_at ? toDateTimeLocalValue(lead.follow_up_at) : '',
          notes: lead.notes ?? '',
        }
      : emptyLeadForm,
    onSubmit: async (values) => {
      try {
        const saved = await save.mutateAsync(toLeadPayload(values));
        onSaved(saved);
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
        <form.Field name="name">
          {(field) => <TextField field={field} label="Nombre" required maxLength={255} />}
        </form.Field>
        <form.Field name="company">
          {(field) => <TextField field={field} label="Empresa" maxLength={255} />}
        </form.Field>
        <form.Field name="email">
          {(field) => <TextField field={field} label="Correo" type="email" hint="Correo o teléfono, al menos uno." />}
        </form.Field>
        <form.Field name="phone">
          {(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}
        </form.Field>
        <form.Field name="source">
          {(field) => (
            <SelectField
              field={field}
              label="Origen"
              options={[{ value: '', label: 'Sin origen' }, ...LEAD_SOURCE_OPTIONS]}
            />
          )}
        </form.Field>
        <form.Field name="status">
          {(field) => <SelectField field={field} label="Estado" options={LEAD_STATUS_OPTIONS} />}
        </form.Field>
        <form.Field name="estimatedValue">
          {(field) => (
            <TextField field={field} label="Valor estimado" inputMode="decimal" placeholder="0.00" hint="Monto en la moneda del negocio." />
          )}
        </form.Field>
        <form.Field name="assignedToUserId">
          {(field) => <TextField field={field} label="ID de usuario asignado (opcional)" inputMode="numeric" />}
        </form.Field>
        <form.Field name="followUpAt">
          {(field) => <TextField field={field} label="Próximo seguimiento" type="datetime-local" />}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => <TextAreaField field={field} label="Notas" rows={4} />}
      </form.Field>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || save.isPending}>
              {isSubmitting || save.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {lead ? 'Guardar cambios' : 'Crear lead'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export { LeadForm };
