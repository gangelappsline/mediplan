import { LoaderCircle } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

import { ADMIN_ROLE_OPTIONS, adminUserCreateSchema, adminUserEditSchema, toAdminUserCreatePayload, toAdminUserEditPayload, type AdminUserCreateValues, type AdminUserEditValues } from '@/features/admin/schemas';
import { useCreateUser, useUpdateUser } from '@/features/admin/hooks';
import { CheckboxField, SelectField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { User } from '@/types';

interface UserFormProps {
  user?: User;
  onSaved: (user: User) => void;
  onCancel: () => void;
}

/** Alta (`POST /admin/users`) y edición (`PUT /admin/users/{id}`) de usuarios. */
export function UserForm({ user, onSaved, onCancel }: UserFormProps) {
  return user ? <EditUserForm user={user} onSaved={onSaved} onCancel={onCancel} /> : <CreateUserForm onSaved={onSaved} onCancel={onCancel} />;
}

function CreateUserForm({ onSaved, onCancel }: Omit<UserFormProps, 'user'>) {
  const create = useCreateUser();

  const form = useAppForm<AdminUserCreateValues>({
    schema: adminUserCreateSchema,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'cliente',
      businessName: '',
      password: '',
      passwordConfirmation: '',
      isActive: true,
    },
    onSubmit: async (values) => {
      try {
        onSaved(await create.mutateAsync(toAdminUserCreatePayload(values)));
      } catch {
        // Notificado por el hook.
      }
    },
  });

  return (
    <FormShell onSubmit={() => void form.handleSubmit()} onCancel={onCancel} submitLabel="Crear usuario" busy={create.isPending}>
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field name="name">{(field) => <TextField field={field} label="Nombre" required maxLength={255} />}</form.Field>
        <form.Field name="email">{(field) => <TextField field={field} label="Correo" type="email" required />}</form.Field>
        <form.Field name="phone">{(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}</form.Field>
        <form.Field name="role">
          {(field) => <SelectField field={field} label="Rol" required options={ADMIN_ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))} />}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.role}>
          {(role) =>
            role === 'negocio' ? (
              <form.Field name="businessName">
                {(field) => <TextField field={field} label="Nombre del negocio" maxLength={255} hint="Se crea el negocio asociado a la cuenta." />}
              </form.Field>
            ) : (
              <div />
            )
          }
        </form.Subscribe>
        <form.Field name="password">{(field) => <TextField field={field} label="Contraseña" type="password" required autoComplete="new-password" />}</form.Field>
        <form.Field name="passwordConfirmation">
          {(field) => <TextField field={field} label="Confirmar contraseña" type="password" required autoComplete="new-password" />}
        </form.Field>
      </div>
      <form.Field name="isActive">
        {(field) => <CheckboxField field={field} label="Cuenta activa" description="Las cuentas inactivas no pueden iniciar sesión." />}
      </form.Field>
    </FormShell>
  );
}

function EditUserForm({ user, onSaved, onCancel }: Required<Pick<UserFormProps, 'user'>> & Omit<UserFormProps, 'user'>) {
  const update = useUpdateUser(user.id);
  const hasBusiness = user.roles.some((role) => role.name === 'business');

  const form = useAppForm<AdminUserEditValues>({
    schema: adminUserEditSchema,
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      addRole: '',
      businessName: user.business?.name ?? '',
      password: '',
      passwordConfirmation: '',
    },
    onSubmit: async (values) => {
      try {
        onSaved(await update.mutateAsync(toAdminUserEditPayload(values)));
      } catch {
        // Notificado por el hook.
      }
    },
  });

  const available = ADMIN_ROLE_OPTIONS.filter((r) => !user.roles.some((current) => current.name === r.name));

  return (
    <FormShell onSubmit={() => void form.handleSubmit()} onCancel={onCancel} submitLabel="Guardar cambios" busy={update.isPending}>
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field name="name">{(field) => <TextField field={field} label="Nombre" required maxLength={255} />}</form.Field>
        <form.Field name="email">{(field) => <TextField field={field} label="Correo" type="email" required />}</form.Field>
        <form.Field name="phone">{(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}</form.Field>
        <form.Field name="addRole">
          {(field) => (
            <SelectField
              field={field}
              label="Añadir rol"
              options={[{ value: '', label: 'No añadir ningún rol' }, ...available.map((r) => ({ value: r.value, label: r.label }))]}
              hint="Para reemplazar todos los roles, usa «Roles» en el detalle del usuario."
            />
          )}
        </form.Field>
        {hasBusiness ? (
          <form.Field name="businessName">
            {(field) => <TextField field={field} label="Nombre del negocio" maxLength={255} />}
          </form.Field>
        ) : null}
        <form.Field name="password">
          {(field) => <TextField field={field} label="Nueva contraseña" type="password" autoComplete="new-password" hint="Déjala vacía para no cambiarla." />}
        </form.Field>
        <form.Field name="passwordConfirmation">
          {(field) => <TextField field={field} label="Confirmar nueva contraseña" type="password" autoComplete="new-password" />}
        </form.Field>
      </div>
    </FormShell>
  );
}

interface FormShellProps {
  children: ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  busy: boolean;
}

/** Envoltorio común de los formularios de usuario: submit, cancelar y estado de envío. */
function FormShell({ children, onSubmit, onCancel, submitLabel, busy }: FormShellProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
