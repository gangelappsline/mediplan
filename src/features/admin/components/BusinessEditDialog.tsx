import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { useUpdateBusiness } from '@/features/admin/hooks';
import { adminBusinessSchema, toAdminBusinessPayload, type AdminBusinessValues } from '@/features/admin/schemas';
import { TextAreaField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { Business } from '@/types';

interface BusinessEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: Business;
}

/** Edición administrativa del negocio (`PUT /admin/businesses/{business}`). */
export function BusinessEditDialog({ open, onOpenChange, business }: BusinessEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Editar negocio" className="max-w-2xl">
      {open ? <BusinessEditForm business={business} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function BusinessEditForm({ business, onDone, onCancel }: { business: Business; onDone: () => void; onCancel: () => void }) {
  const update = useUpdateBusiness(business.id);

  const form = useAppForm<AdminBusinessValues>({
    schema: adminBusinessSchema,
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
        await update.mutateAsync(toAdminBusinessPayload(values));
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
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field name="name">{(field) => <TextField field={field} label="Nombre" required maxLength={255} />}</form.Field>
        <form.Field name="city">{(field) => <TextField field={field} label="Ciudad" maxLength={120} />}</form.Field>
        <form.Field name="email">{(field) => <TextField field={field} label="Correo" type="email" />}</form.Field>
        <form.Field name="phone">{(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}</form.Field>
        <div className="sm:col-span-2">
          <form.Field name="address">{(field) => <TextField field={field} label="Dirección" maxLength={255} />}</form.Field>
        </div>
      </div>
      <form.Field name="description">{(field) => <TextAreaField field={field} label="Descripción" rows={3} />}</form.Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {isSubmitting || update.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Guardar cambios
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
