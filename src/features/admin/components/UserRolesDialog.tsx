import { Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState, type FormEvent } from 'react';

import { useAdminRoles, useReplaceUserRoles } from '@/features/admin/hooks';
import { Avatar } from '@/shared/components/Avatar';
import { ErrorState, LoadingState } from '@/shared/components/QueryState';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Dialog } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { springSnappy } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';
import type { RoleName, User } from '@/types';

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

/** Reemplaza los roles del usuario (`PUT /admin/users/{user}/roles`). Requiere al menos un rol. */
export function UserRolesDialog({ open, onOpenChange, user }: UserRolesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Roles del usuario"
      description={`Sustituyen por completo a los roles actuales de ${user.name}.`}
      className="max-w-xl"
    >
      {open ? <RolesForm user={user} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function RolesForm({ user, onDone, onCancel }: { user: User; onDone: () => void; onCancel: () => void }) {
  const catalog = useAdminRoles();
  const replace = useReplaceUserRoles();
  const [selected, setSelected] = useState<RoleName[]>(user.roles.map((role) => role.name));
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(() => user.roles.map((role) => role.name).sort().join(','), [user.roles]);
  const current = [...selected].sort().join(',');
  const unchanged = current === initial;

  function toggle(name: RoleName, checked: boolean) {
    setError(null);
    setSelected((prev) => (checked ? [...new Set([...prev, name])] : prev.filter((item) => item !== name)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) {
      setError('Selecciona al menos un rol.');
      return;
    }
    replace.mutate({ id: user.id, roles: selected }, { onSuccess: onDone });
  }

  if (catalog.isLoading) return <LoadingState />;
  if (catalog.error) return <ErrorState error={catalog.error} onRetry={() => void catalog.refetch()} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
        <Avatar name={user.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{selected.length}</span> seleccionado(s)
        </span>
      </div>

      <StaggerList className="space-y-2">
        {(catalog.data ?? []).map((role) => {
          const id = `role-${role.name}`;
          const isChecked = selected.includes(role.name);

          return (
            <StaggerItem key={role.id}>
              <motion.div
                whileHover={{ y: -1 }}
                transition={springSnappy}
                onClick={(event) => {
                  // El checkbox y su etiqueta ya conmutan por su cuenta.
                  const target = event.target as HTMLElement;
                  if (target.closest('button[role="checkbox"]') || target.closest('label')) return;
                  toggle(role.name, !isChecked);
                }}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                  isChecked ? 'border-primary/50 bg-primary/5' : 'border-border/70 hover:border-primary/30',
                )}
              >
                <Checkbox
                  id={id}
                  checked={isChecked}
                  onCheckedChange={(checked) => toggle(role.name, checked === true)}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1 space-y-0.5">
                  <Label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold">
                    <ShieldCheck className={cn('size-3.5', isChecked ? 'text-primary' : 'text-muted-foreground')} />
                    {role.label}
                    {isChecked ? (
                      <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-primary">
                        <Check className="size-3.5" />
                      </motion.span>
                    ) : null}
                  </Label>
                  {role.description ? (
                    <span className="block text-xs text-muted-foreground">{role.description}</span>
                  ) : null}
                  <span className="block text-[11px] text-muted-foreground">
                    {(role.users_count ?? 0).toLocaleString('es-MX')} usuarios en la plataforma
                  </span>
                </span>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {error ? (
        <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-destructive">
          {error}
        </motion.p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">
          {unchanged ? 'Sin cambios respecto a los roles actuales.' : 'Se enviará la lista completa de roles.'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={replace.isPending || selected.length === 0 || unchanged}>
            {replace.isPending ? <LoaderCircle className="animate-spin" /> : null}
            Guardar roles
          </Button>
        </div>
      </div>
    </form>
  );
}
