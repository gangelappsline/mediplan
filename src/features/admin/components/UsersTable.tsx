import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { UserStatusControl } from '@/features/admin/components/UserStatusControl';
import { Avatar } from '@/shared/components/Avatar';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { formatDate, timeAgo } from '@/shared/lib/format';
import type { User } from '@/types';

interface UsersTableProps {
  users: ReadonlyArray<User>;
  onManageRoles: (user: User) => void;
}

const headClass = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase';

/** Tabla de usuarios con filas animadas y acciones rápidas al pasar el cursor. */
export function UsersTable({ users, onManageRoles }: UsersTableProps) {
  return (
    <div className="scroll-area overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">Usuarios de la plataforma con sus roles, negocio y estado</caption>
        <thead className="border-b border-border/60 bg-muted/40">
          <tr>
            <th scope="col" className={headClass}>Usuario</th>
            <th scope="col" className={`${headClass} hidden md:table-cell`}>Roles</th>
            <th scope="col" className={`${headClass} hidden lg:table-cell`}>Negocio</th>
            <th scope="col" className={`${headClass} hidden sm:table-cell`}>Alta</th>
            <th scope="col" className={headClass}>Estado</th>
            <th scope="col" className={`${headClass} text-right`}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <StaggerList as="tbody" className="divide-y divide-border/60">
          {users.map((user) => (
            <StaggerItem
              as="tr"
              key={user.id}
              className="group/row transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/admin/usuarios/${user.id}`}
                  className="flex items-center gap-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-lg"
                >
                  <Avatar name={user.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block max-w-[16rem] truncate font-medium group-hover/row:text-primary">{user.name}</span>
                    <span className="block max-w-[16rem] truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                </Link>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role.name} variant="outline" className="font-normal">
                      {role.label}
                    </Badge>
                  ))}
                  {user.roles.length === 0 ? <span className="text-xs text-muted-foreground">—</span> : null}
                </div>
              </td>
              <td className="hidden max-w-[14rem] truncate px-4 py-3 text-muted-foreground lg:table-cell">
                {user.business?.name ?? '—'}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                {user.created_at ? (
                  <Tooltip content={timeAgo(user.created_at)}>
                    <span className="cursor-default text-muted-foreground">{formatDate(user.created_at)}</span>
                  </Tooltip>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <UserStatusControl user={user} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100">
                  <Tooltip content="Gestionar roles">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Gestionar roles de ${user.name}`}
                      onClick={() => onManageRoles(user)}
                    >
                      <ShieldCheck />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Ver detalle">
                    <Button type="button" variant="ghost" size="icon" className="size-8" asChild>
                      <Link to={`/admin/usuarios/${user.id}`} aria-label={`Ver detalle de ${user.name}`}>
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </Tooltip>
                </div>
              </td>
            </StaggerItem>
          ))}
        </StaggerList>
      </table>
    </div>
  );
}
