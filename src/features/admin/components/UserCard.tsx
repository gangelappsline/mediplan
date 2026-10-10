import { ArrowUpRight, Building2, CalendarPlus, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { UserStatusControl } from '@/features/admin/components/UserStatusControl';
import { Avatar } from '@/shared/components/Avatar';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { springSoft } from '@/shared/lib/animations';
import { formatDate, timeAgo } from '@/shared/lib/format';
import type { User } from '@/types';

interface UserCardProps {
  user: User;
  onManageRoles: (user: User) => void;
}

/** Tarjeta de usuario para la vista de cuadrícula del listado administrativo. */
export function UserCard({ user, onManageRoles }: UserCardProps) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={springSoft}
      className="group relative flex h-full flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:shadow-md"
    >
      <header className="flex items-start gap-3">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/admin/usuarios/${user.id}`}
            className="block truncate font-semibold tracking-tight hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {user.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <StatusBadge name={user.is_active ? 'active' : 'inactive'} label={user.is_active ? 'Activo' : 'Inactivo'} />
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        {user.roles.map((role) => (
          <Badge key={role.name} variant="outline" className="gap-1 font-normal">
            <ShieldCheck className="size-3 text-primary" />
            {role.label}
          </Badge>
        ))}
        {user.roles.length === 0 ? (
          <span className="text-xs text-muted-foreground">Sin roles asignados</span>
        ) : null}
      </div>

      <dl className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Building2 className="size-3.5 shrink-0" />
          <dt className="sr-only">Negocio</dt>
          <dd className="truncate">{user.business?.name ?? 'Sin negocio asociado'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarPlus className="size-3.5 shrink-0" />
          <dt className="sr-only">Alta</dt>
          <dd className="truncate">
            {user.created_at ? `${formatDate(user.created_at)} · ${timeAgo(user.created_at)}` : 'Sin fecha'}
          </dd>
        </div>
      </dl>

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <UserStatusControl user={user} withLabel />
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => onManageRoles(user)}>
            Roles
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-8" asChild>
            <Link to={`/admin/usuarios/${user.id}`} aria-label={`Ver detalle de ${user.name}`}>
              <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Button>
        </div>
      </footer>
    </motion.article>
  );
}
