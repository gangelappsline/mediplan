import { LoaderCircle, MapPin, Mail, Store } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

import { useUpdateBusiness } from '@/features/admin/hooks';
import { adminBusinessSchema, toAdminBusinessPayload, type AdminBusinessValues } from '@/features/admin/schemas';
import { Avatar } from '@/shared/components/Avatar';
import { TextAreaField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { StatusBadge } from '@/shared/components/StatusBadge';
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar negocio"
      description="Se envían los mismos campos que acepta la API de MediPlan."
      className="max-w-2xl"
      icon={
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Store className="size-5" />
        </span>
      }
    >
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
        <Avatar name={business.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{business.name}</p>
          <p className="truncate text-xs text-muted-foreground">Negocio #{business.id}</p>
        </div>
        <StatusBadge name={business.status.name} label={business.status.label} />
      </div>

      <Section title="Identidad" icon={Store}>
        <form.Field name="name">{(field) => <TextField field={field} label="Nombre" required maxLength={255} />}</form.Field>
        <form.Field name="description">{(field) => <TextAreaField field={field} label="Descripción" rows={3} />}</form.Field>
      </Section>

      <Section title="Contacto" icon={Mail}>
        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field name="email">{(field) => <TextField field={field} label="Correo" type="email" />}</form.Field>
          <form.Field name="phone">{(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}</form.Field>
        </div>
      </Section>

      <Section title="Ubicación" icon={MapPin}>
        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field name="address">{(field) => <TextField field={field} label="Dirección" maxLength={255} />}</form.Field>
          <form.Field name="city">{(field) => <TextField field={field} label="Ciudad" maxLength={120} />}</form.Field>
        </div>
      </Section>

      <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
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

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Store; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
