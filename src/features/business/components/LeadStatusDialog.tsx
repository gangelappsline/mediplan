import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useUpdateLeadStatus } from '@/features/business/hooks';
import { LEAD_STATUS_OPTIONS } from '@/features/business/labels';
import {
  leadStatusFormSchema,
  toLeadStatusPayload,
  type LeadStatusFormValues,
} from '@/features/business/schemas';
import { SelectField, TextAreaField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { toDateTimeLocalValue } from '@/shared/lib/format';
import type { Lead } from '@/types';

interface LeadStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

/** Cambio de estado y seguimiento (`PATCH /business/leads/{id}/status`). */
function LeadStatusDialog({ open, onOpenChange, lead }: LeadStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Actualizar estado del lead" description={lead.name}>
      {open ? <LeadStatusForm lead={lead} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function LeadStatusForm({ lead, onDone, onCancel }: { lead: Lead; onDone: () => void; onCancel: () => void }) {
  const update = useUpdateLeadStatus();

  const form = useAppForm<LeadStatusFormValues>({
    schema: leadStatusFormSchema,
    defaultValues: {
      status: lead.status.name as LeadStatusFormValues['status'],
      followUpAt: lead.follow_up_at ? toDateTimeLocalValue(lead.follow_up_at) : '',
      notes: '',
    },
    onSubmit: async (values) => {
      try {
        await update.mutateAsync({ id: lead.id, payload: toLeadStatusPayload(values) });
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
      <form.Field name="status">
        {(field) => <SelectField field={field} label="Estado" options={LEAD_STATUS_OPTIONS} />}
      </form.Field>
      <form.Field name="followUpAt">
        {(field) => (
          <TextField field={field} label="Próximo seguimiento" type="datetime-local" hint="Déjalo vacío para quitar el seguimiento." />
        )}
      </form.Field>
      <form.Field name="notes">
        {(field) => <TextAreaField field={field} label="Nota de la actualización" rows={3} hint="Opcional." />}
      </form.Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {isSubmitting || update.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export { LeadStatusDialog };
