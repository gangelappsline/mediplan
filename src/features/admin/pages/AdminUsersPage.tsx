import { Plus, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAdminUsers } from '@/features/admin/hooks';
import { LinkButton } from '@/shared/components/LinkButton';
import { Avatar } from '@/shared/components/Avatar';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { formatDate } from '@/shared/lib/format';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const users = useAdminUsers({ search: debounced || undefined, page, per_page: 15 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Cuentas de clientes, negocios y administradores."
        actions={<LinkButton to="/admin/usuarios/nuevo"><Plus />Nuevo usuario</LinkButton>}
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o correo"
              aria-label="Buscar usuarios"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <QueryBoundary
        isLoading={users.isLoading}
        error={users.error}
        onRetry={() => void users.refetch()}
        isEmpty={users.data?.data.length === 0}
        emptyState={<EmptyState icon={Users} title="No hay usuarios que coincidan" description="Prueba con otra búsqueda." />}
      >
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Roles</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Negocio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.data?.data.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/usuarios/${user.id}`} className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium hover:underline">{user.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role.name} variant="outline">
                            {role.label}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{user.business?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge name={user.is_active ? 'active' : 'inactive'} label={user.is_active ? 'Activo' : 'Inactivo'} />
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {user.created_at ? formatDate(user.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4">
            <Pagination meta={users.data?.meta} onPageChange={setPage} />
          </div>
        </Card>
      </QueryBoundary>
    </div>
  );
}
