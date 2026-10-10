import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useSaveClient } from '@/features/business/hooks';
import { CLIENT_STATUS_OPTIONS } from '@/features/business/labels';
import {
  clientFormSchema,
  emptyClientForm,
  toClientPayload,
  type ClientFormValues,
} from '@/features/business/schemas';
import { TextAreaField, TextField, SelectField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { isoToDateValue } from '@/shared/lib/format';
import type { Client } from '@/types';

interface ClientFormProps {
  client?: Client;
  onSaved: (client: Client) => void;
  onCancel?: () => void;
}

/** Alta y edición de clientes (`POST` / `PUT /business/clients`). */
function ClientForm({ client, onSaved, onCancel }: ClientFormProps) {
  const save = useSaveClient(client?.id);

  const form = useAppForm<ClientFormValues>({
    schema: clientFormSchema,
    defaultValues: client
      ? {
          name: client.name,
          email: client.email ?? '',
          phone: client.phone ?? '',
          birthDate: isoToDateValue(client.birth_date),
          notes: client.notes ?? '',
          status: client.status.name === 'inactive' ? 'inactive' : 'active',
          userId: client.user?.id ? String(client.user.id) : '',
        }
      : emptyClientForm,
    onSubmit: async (values) => {
      try {
        const saved = await save.mutateAsync(toClientPayload(values));
        onSaved(saved);
      } catch {
        // El error ya se notifica desde el hook de mutación.
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
          {(field) => <TextField field={field} label="Nombre completo" required maxLength={255} />}
        </form.Field>
        <form.Field name="email">
          {(field) => <TextField field={field} label="Correo" type="email" autoComplete="off" />}
        </form.Field>
        <form.Field name="phone">
          {(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}
        </form.Field>
        <form.Field name="birthDate">
          {(field) => <TextField field={field} label="Fecha de nacimiento" type="date" />}
        </form.Field>
        <form.Field name="status">
          {(field) => <SelectField field={field} label="Estado" options={CLIENT_STATUS_OPTIONS} />}
        </form.Field>
        <form.Field name="userId">
          {(field) => (
            <TextField
              field={field}
              label="ID de usuario vinculado (opcional)"
              inputMode="numeric"
              hint="Déjalo vacío si el cliente no tiene cuenta en MediPlan."
            />
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => <TextAreaField field={field} label="Notas" rows={4} hint="Máximo 2000 caracteres." />}
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
              {client ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export { ClientForm };
