import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { convertedClient } from '@/features/business/api';
import { useConvertLead } from '@/features/business/hooks';
import {
  convertLeadFormSchema,
  toConvertLeadPayload,
  type ConvertLeadFormValues,
} from '@/features/business/schemas';
import { TextAreaField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { Client, Lead } from '@/types';

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onConverted: (client: Client) => void;
}

/**
 * Convierte un lead en cliente (`POST /business/leads/{id}/convert`).
 * Los campos son opcionales: si están vacíos, la API usa los datos del lead.
 */
function ConvertLeadDialog({ open, onOpenChange, lead, onConverted }: ConvertLeadDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Convertir en cliente"
      description="Revisa los datos del cliente. Lo que dejes vacío se toma del lead."
      className="max-w-xl"
    >
      {open ? (
        <ConvertForm
          lead={lead}
          onCancel={() => onOpenChange(false)}
          onConverted={(client) => {
            onOpenChange(false);
            onConverted(client);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function ConvertForm({ lead, onCancel, onConverted }: { lead: Lead; onCancel: () => void; onConverted: (client: Client) => void }) {
  const convert = useConvertLead();

  const form = useAppForm<ConvertLeadFormValues>({
    schema: convertLeadFormSchema,
    defaultValues: { name: '', email: '', phone: '', notes: '' },
    onSubmit: async (values) => {
      try {
        const result = await convert.mutateAsync({ id: lead.id, payload: toConvertLeadPayload(values) });
        onConverted(convertedClient(result));
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
      <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
        Datos del lead: <strong className="text-foreground">{lead.name}</strong>
        {lead.email ? ` · ${lead.email}` : ''}
        {lead.phone ? ` · ${lead.phone}` : ''}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field name="name">
          {(field) => <TextField field={field} label="Nombre (opcional)" maxLength={255} placeholder={lead.name} />}
        </form.Field>
        <form.Field name="email">
          {(field) => <TextField field={field} label="Correo (opcional)" type="email" placeholder={lead.email ?? ''} />}
        </form.Field>
        <form.Field name="phone">
          {(field) => <TextField field={field} label="Teléfono (opcional)" type="tel" placeholder={lead.phone ?? ''} />}
        </form.Field>
      </div>
      <form.Field name="notes">
        {(field) => <TextAreaField field={field} label="Notas (opcional)" rows={3} />}
      </form.Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || convert.isPending}>
              {isSubmitting || convert.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Convertir en cliente
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export { ConvertLeadDialog };
