import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { Building2, LoaderCircle, SearchX, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { adminBusinessesQuery, adminUsersQuery } from '@/features/admin/hooks';
import { Avatar } from '@/shared/components/Avatar';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

interface AdminPaletteResultsProps {
  query: string;
  close: () => void;
}

const groupClass =
  'mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/80 [&_[cmdk-group-heading]]:uppercase';

const itemClass =
  'group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground';

/**
 * Resultados dinámicos de la paleta de comandos del administrador: busca
 * usuarios y negocios con los mismos endpoints y parámetros que los listados
 * (`GET /admin/users?search=…` y `GET /admin/businesses?search=…`).
 */
export function AdminPaletteResults({ query, close }: AdminPaletteResultsProps) {
  const navigate = useNavigate();
  const debounced = useDebouncedValue(query.trim(), 250);
  const enabled = debounced.length >= 2;

  const users = useQuery({
    ...adminUsersQuery({ search: debounced, page: 1, per_page: 5 }),
    enabled,
  });
  const businesses = useQuery({
    ...adminBusinessesQuery({ search: debounced, page: 1, per_page: 5 }),
    enabled,
  });

  if (!enabled) return null;

  if (users.isFetching || businesses.isFetching) {
    return (
      <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Buscando «{debounced}» en la plataforma…
      </div>
    );
  }

  const userList = users.data?.data ?? [];
  const businessList = businesses.data?.data ?? [];

  if (userList.length === 0 && businessList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-sm text-muted-foreground">
        <SearchX className="size-5" />
        Sin usuarios ni negocios para «{debounced}».
      </div>
    );
  }

  return (
    <>
      {userList.length > 0 ? (
        <Command.Group heading="Usuarios" className={groupClass}>
          {userList.map((user) => (
            <Command.Item
              key={user.id}
              value={`user-${user.id}`}
              onSelect={() => {
                close();
                navigate(`/admin/usuarios/${user.id}`);
              }}
              className={itemClass}
            >
              <Avatar name={user.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{user.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <UserRound className="size-3.5" />
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      ) : null}

      {businessList.length > 0 ? (
        <Command.Group heading="Negocios" className={groupClass}>
          {businessList.map((business) => (
            <Command.Item
              key={business.id}
              value={`business-${business.id}`}
              onSelect={() => {
                close();
                navigate(`/admin/negocios/${business.id}`);
              }}
              className={itemClass}
            >
              <Avatar name={business.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{business.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[business.city, business.owner?.name].filter(Boolean).join(' · ') || 'Sin ciudad ni propietario'}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                {business.status.label}
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      ) : null}
    </>
  );
}
