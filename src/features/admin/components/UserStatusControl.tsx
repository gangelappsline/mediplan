import { useState } from 'react';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useUpdateUserStatus } from '@/features/admin/hooks';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Switch } from '@/shared/components/ui/switch';
import { Tooltip } from '@/shared/components/ui/tooltip';
import type { User } from '@/types';

interface UserStatusControlProps {
  user: User;
  /** Muestra además la etiqueta Activo/Inactivo junto al interruptor. */
  withLabel?: boolean;
}

/**
 * Interruptor de alta/baja de un usuario. Pide confirmación antes de llamar a
 * `PATCH /admin/users/{user}/status` con el mismo valor `is_active` de siempre.
 * No permite desactivar la propia cuenta.
 */
export function UserStatusControl({ user, withLabel = false }: UserStatusControlProps) {
  const me = useCurrentUser();
  const isSelf = me?.id === user.id;
  const updateStatus = useUpdateUserStatus();
  const [confirming, setConfirming] = useState(false);

  const switchControl = (
    <Switch
      checked={user.is_active}
      disabled={isSelf || updateStatus.isPending}
      onCheckedChange={() => setConfirming(true)}
      aria-label={user.is_active ? `Desactivar a ${user.name}` : `Activar a ${user.name}`}
    />
  );

  return (
    <>
      <div className="flex items-center gap-2">
        {isSelf ? (
          <Tooltip content="No puedes desactivar tu propia cuenta">
            <span className="inline-flex cursor-not-allowed opacity-60">{switchControl}</span>
          </Tooltip>
        ) : (
          <Tooltip content={user.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}>{switchControl}</Tooltip>
        )}
        {withLabel ? (
          <span className={`text-xs font-medium ${user.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            {user.is_active ? 'Activo' : 'Inactivo'}
          </span>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={user.is_active ? `¿Desactivar a ${user.name}?` : `¿Activar a ${user.name}?`}
        description={
          user.is_active
            ? 'El usuario no podrá iniciar sesión hasta que la actives de nuevo.'
            : 'El usuario podrá volver a iniciar sesión.'
        }
        confirmLabel={user.is_active ? 'Desactivar' : 'Activar'}
        destructive={user.is_active}
        isPending={updateStatus.isPending}
        onConfirm={() =>
          updateStatus.mutate({ id: user.id, isActive: !user.is_active }, { onSuccess: () => setConfirming(false) })
        }
      />
    </>
  );
}
