import { LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useAdminRoles, useReplaceUserRoles } from '@/features/admin/hooks';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Dialog } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { LoadingState, ErrorState } from '@/shared/components/QueryState';
import type { RoleName, User } from '@/types';

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

/** Reemplaza los roles del usuario (`PUT /admin/users/{user}/roles`). Requiere al menos un rol. */
export function UserRolesDialog({ open, onOpenChange, user }: UserRolesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Roles del usuario" description={`Selecciona los roles de ${user.name}.`}>
      {open ? <RolesForm user={user} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function RolesForm({ user, onDone, onCancel }: { user: User; onDone: () => void; onCancel: () => void }) {
  const catalog = useAdminRoles();
  const replace = useReplaceUserRoles();
  const [selected, setSelected] = useState<RoleName[]>(user.roles.map((role) => role.name));
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-3">
        {(catalog.data ?? []).map((role) => {
          const id = `role-${role.name}`;
          return (
            <div key={role.id} className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id={id}
                checked={selected.includes(role.name)}
                onCheckedChange={(checked) => toggle(role.name, checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor={id}>{role.label}</Label>
                {role.description ? <p className="text-xs text-muted-foreground">{role.description}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={replace.isPending}>
          {replace.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Guardar roles
        </Button>
      </div>
    </form>
  );
}
