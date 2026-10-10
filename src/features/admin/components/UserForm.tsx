import {
  BadgeCheck,
  Building2,
  Check,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Store,
  UserRound,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { FormEvent, ReactNode } from 'react';

import { ADMIN_ROLE_OPTIONS, adminUserCreateSchema, adminUserEditSchema, toAdminUserCreatePayload, toAdminUserEditPayload, type AdminUserCreateValues, type AdminUserEditValues } from '@/features/admin/schemas';
import { useCreateUser, useUpdateUser } from '@/features/admin/hooks';
import { Avatar } from '@/shared/components/Avatar';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { CheckboxField, SelectField, TextField } from '@/shared/components/form/Fields';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Meter } from '@/shared/components/ui/meter';
import { Badge } from '@/shared/components/ui/badge';
import { springSnappy, tweenFast } from '@/shared/lib/animations';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { cn } from '@/shared/lib/utils';
import type { RoleName, User } from '@/types';

interface UserFormProps {
  user?: User;
  onSaved: (user: User) => void;
  onCancel: () => void;
}

const ROLE_ICONS: Record<string, typeof UserRound> = {
  cliente: UserRound,
  negocio: Store,
  administrador: ShieldCheck,
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  cliente: 'Paciente con acceso a sus citas.',
  negocio: 'Clínica con agenda, CRM y reportes.',
  administrador: 'Control total de la plataforma.',
};

/** Alta (`POST /admin/users`) y edición (`PUT /admin/users/{id}`) de usuarios. */
export function UserForm({ user, onSaved, onCancel }: UserFormProps) {
  return user ? (
    <EditUserForm user={user} onSaved={onSaved} onCancel={onCancel} />
  ) : (
    <CreateUserForm onSaved={onSaved} onCancel={onCancel} />
  );
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <FormShell onSubmit={() => void form.handleSubmit()} onCancel={onCancel} submitLabel="Crear usuario" busy={create.isPending}>
        <FormSection title="Identidad" description="Datos de contacto de la cuenta." icon={UserRound}>
          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field name="name">{(field) => <TextField field={field} label="Nombre" required maxLength={255} />}</form.Field>
            <form.Field name="email">{(field) => <TextField field={field} label="Correo" type="email" required />}</form.Field>
            <form.Field name="phone">{(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}</form.Field>
          </div>
        </FormSection>

        <FormSection title="Rol" description="Define a qué panel tendrá acceso." icon={ShieldCheck}>
          <form.Field name="role">
            {(field) => (
              <div className="space-y-2">
                <RolePicker
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  options={ADMIN_ROLE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                    icon: ROLE_ICONS[option.value] ?? ShieldCheck,
                    description: ROLE_DESCRIPTIONS[option.value] ?? '',
                  }))}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.role}>
            {(role) => (
              <AnimatePresence initial={false}>
                {role === 'negocio' ? (
                  <motion.div
                    key="business-name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={tweenFast}
                    className="overflow-hidden"
                  >
                    <form.Field name="businessName">
                      {(field) => (
                        <TextField
                          field={field}
                          label="Nombre del negocio"
                          maxLength={255}
                          hint="Se crea el negocio asociado a la cuenta."
                          className="space-y-2 pt-4"
                        />
                      )}
                    </form.Field>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}
          </form.Subscribe>
        </FormSection>

        <FormSection title="Seguridad" description="Mínimo 8 caracteres; debe coincidir la confirmación." icon={KeyRound}>
          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <TextField field={field} label="Contraseña" type="password" required autoComplete="new-password" />
                  <PasswordStrength value={field.state.value} />
                </div>
              )}
            </form.Field>
            <form.Field name="passwordConfirmation">
              {(field) => <TextField field={field} label="Confirmar contraseña" type="password" required autoComplete="new-password" />}
            </form.Field>
          </div>
        </FormSection>

        <FormSection title="Estado" description="Puedes desactivarla más adelante desde el detalle." icon={BadgeCheck}>
          <form.Field name="isActive">
            {(field) => <CheckboxField field={field} label="Cuenta activa" description="Las cuentas inactivas no pueden iniciar sesión." />}
          </form.Field>
        </FormSection>
      </FormShell>

      <form.Subscribe selector={(state) => [state.values.name, state.values.email, state.values.role, state.values.businessName, state.values.isActive] as const}>
        {([name, email, role, businessName, isActive]) => (
          <UserPreview
            name={name}
            email={email}
            roleLabel={ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role}
            roleName={(ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.name ?? 'client') as RoleName}
            businessName={role === 'negocio' ? businessName : ''}
            isActive={isActive}
            title="Vista previa"
          />
        )}
      </form.Subscribe>
    </div>
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <FormShell onSubmit={() => void form.handleSubmit()} onCancel={onCancel} submitLabel="Guardar cambios" busy={update.isPending}>
        <FormSection title="Identidad" description="Actualiza los datos de contacto." icon={UserRound}>
          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field name="name">{(field) => <TextField field={field} label="Nombre" required maxLength={255} />}</form.Field>
            <form.Field name="email">{(field) => <TextField field={field} label="Correo" type="email" required />}</form.Field>
            <form.Field name="phone">{(field) => <TextField field={field} label="Teléfono" type="tel" maxLength={30} />}</form.Field>
          </div>
        </FormSection>

        <FormSection
          title="Roles"
          description="Añadir un rol no quita los existentes."
          icon={ShieldCheck}
        >
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {user.roles.map((role) => (
              <Badge key={role.name} variant="secondary" className="gap-1">
                <ShieldCheck className="size-3 text-primary" />
                {role.label}
              </Badge>
            ))}
            {user.roles.length === 0 ? <span className="text-xs text-muted-foreground">Sin roles asignados</span> : null}
          </div>
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
              {(field) => <TextField field={field} label="Nombre del negocio" maxLength={255} className="space-y-2 pt-4" />}
            </form.Field>
          ) : null}
        </FormSection>

        <FormSection title="Seguridad" description="Déjala vacía para conservar la contraseña actual." icon={KeyRound}>
          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <TextField field={field} label="Nueva contraseña" type="password" autoComplete="new-password" hint="Déjala vacía para no cambiarla." />
                  {field.state.value ? <PasswordStrength value={field.state.value} /> : null}
                </div>
              )}
            </form.Field>
            <form.Field name="passwordConfirmation">
              {(field) => <TextField field={field} label="Confirmar nueva contraseña" type="password" autoComplete="new-password" />}
            </form.Field>
          </div>
        </FormSection>
      </FormShell>

      <form.Subscribe selector={(state) => [state.values.name, state.values.email, state.values.addRole, state.values.businessName] as const}>
        {([name, email, addRole, businessName]) => (
          <UserPreview
            name={name}
            email={email}
            roleLabel={addRole ? `+ ${ADMIN_ROLE_OPTIONS.find((option) => option.value === addRole)?.label ?? addRole}` : 'Sin cambios de rol'}
            roleName={(ADMIN_ROLE_OPTIONS.find((option) => option.value === addRole)?.name ?? user.roles[0]?.name ?? 'client') as RoleName}
            businessName={businessName}
            isActive={user.is_active}
            title="Vista previa"
            extraRoles={user.roles.map((role) => role.label)}
          />
        )}
      </form.Subscribe>
    </div>
  );
}

/* --------------------------------- Piezas --------------------------------- */

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
    <Card className="gap-0 py-0">
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-8 p-6">{children}</CardContent>
        <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-b-xl border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
          <p className="hidden text-xs text-muted-foreground sm:block">Los campos marcados con * son obligatorios.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="animate-spin" /> : null}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof UserRound;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface RolePickerProps {
  value: string;
  onChange: (value: 'cliente' | 'negocio' | 'administrador') => void;
  options: ReadonlyArray<{ value: 'cliente' | 'negocio' | 'administrador'; label: string; icon: typeof UserRound; description: string }>;
}

/** Selector de rol en tarjetas (envía el mismo valor que el Select anterior). */
function RolePicker({ value, onChange, options }: RolePickerProps) {
  return (
    <div role="radiogroup" aria-label="Rol del usuario" className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <motion.button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={springSnappy}
            className={cn(
              'relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left outline-none',
              'focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isActive ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border/70 bg-card hover:border-primary/30',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="role-picker-check"
                transition={springSnappy}
                className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Check className="size-3" />
              </motion.span>
            ) : null}
            <span className={cn('flex size-9 items-center justify-center rounded-lg', isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
              <Icon className="size-4.5" />
            </span>
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Fuerza de la contraseña: solo orientación visual, no cambia lo que se envía. */
function PasswordStrength({ value }: { value: string }) {
  const checks = [
    { label: '8 caracteres', ok: value.length >= 8 },
    { label: 'Mayúscula y minúscula', ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: 'Número', ok: /\d/.test(value) },
    { label: 'Símbolo', ok: /[^A-Za-z0-9]/.test(value) },
  ];
  const score = checks.filter((check) => check.ok).length;
  const label = ['', 'Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][score] ?? '';
  const tone = ['', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500', 'bg-emerald-500'][score] ?? '';

  if (!value) return null;

  return (
    <div className="space-y-1.5">
      <Meter value={score} max={4} label="Fuerza de la contraseña" barClassName={tone}>
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-[11px] font-medium', score >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
            {label}
          </p>
          <ul className="flex flex-wrap justify-end gap-x-2 gap-y-0.5">
            {checks.map((check) => (
              <li key={check.label} className={cn('text-[10px]', check.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70')}>
                {check.ok ? '✓' : '·'} {check.label}
              </li>
            ))}
          </ul>
        </div>
      </Meter>
    </div>
  );
}

interface UserPreviewProps {
  name: string;
  email: string;
  roleLabel: string;
  roleName: RoleName;
  businessName?: string;
  isActive: boolean;
  title: string;
  extraRoles?: string[];
}

/** Vista previa en vivo de la cuenta que se está creando o editando. */
function UserPreview({ name, email, roleLabel, businessName, isActive, title, extraRoles = [] }: UserPreviewProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>Así se verá la cuenta en el panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={name || 'Nuevo usuario'} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name || 'Sin nombre'}</p>
              <p className="truncate text-xs text-muted-foreground">{email || 'sin correo'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {extraRoles.map((role) => (
              <Badge key={role} variant="outline" className="gap-1 font-normal">
                <ShieldCheck className="size-3 text-primary" />
                {role}
              </Badge>
            ))}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={roleLabel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={tweenFast}
              >
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Users className="size-3" />
                  {roleLabel}
                </Badge>
              </motion.span>
            </AnimatePresence>
          </div>

          <AnimatePresence initial={false}>
            {businessName ? (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 overflow-hidden text-xs text-muted-foreground"
              >
                <Building2 className="size-3.5 text-primary" />
                {businessName}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <div className="flex items-center justify-between rounded-lg bg-muted/60 p-2.5 text-xs">
            <span className="text-muted-foreground">Estado de la cuenta</span>
            <span className={cn('font-semibold', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
              {isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </CardContent>
      </Card>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        La validación y los valores enviados son exactamente los que define la API de MediPlan; esta vista es solo
        orientativa.
      </p>
    </aside>
  );
}
