import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useUpdateBusinessProfile } from '@/features/business/hooks';
import {
  businessProfileFormSchema,
  toBusinessProfilePayload,
  type BusinessProfileFormValues,
} from '@/features/business/schemas';
import { TextAreaField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { Business } from '@/types';

/** Datos del negocio (`PUT /business/profile`). El nombre es obligatorio. */
function BusinessProfileForm({ business }: { business: Business }) {
  const update = useUpdateBusinessProfile();

  const form = useAppForm<BusinessProfileFormValues>({
    schema: businessProfileFormSchema,
    defaultValues: {
      name: business.name,
      description: business.description ?? '',
      email: business.email ?? '',
      phone: business.phone ?? '',
      address: business.address ?? '',
      city: business.city ?? '',
    },
    onSubmit: async (values) => {
      try {
        await update.mutateAsync(toBusinessProfilePayload(values));
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
          {(field) => <TextField field={field} label="Nombre del negocio" required maxLength={255} />}
        </form.Field>
        <form.Field name="city">
          {(field) => <TextField field={field} label="Ciudad" maxLength={120} />}
        </form.Field>
        <form.Field name="email">
          {(field) => <TextField field={field} label="Correo de contacto" type="email" />}
        </form.Field>
        <form.Field name="phone">
          {(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}
        </form.Field>
        <div className="sm:col-span-2">
          <form.Field name="address">
            {(field) => <TextField field={field} label="Dirección" maxLength={255} />}
          </form.Field>
        </div>
      </div>
      <form.Field name="description">
        {(field) => <TextAreaField field={field} label="Descripción" rows={4} hint="Máximo 2000 caracteres." />}
      </form.Field>
      <div className="flex justify-end">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {isSubmitting || update.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Guardar perfil
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export { BusinessProfileForm };
