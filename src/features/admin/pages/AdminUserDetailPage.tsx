import { ArrowLeft, Pencil, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { UserRolesDialog } from '@/features/admin/components/UserRolesDialog';
import { useAdminUser, useDeleteUser, useUpdateUserStatus } from '@/features/admin/hooks';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { LinkButton } from '@/shared/components/LinkButton';
import { Avatar } from '@/shared/components/Avatar';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDateTime } from '@/shared/lib/format';

export function AdminUserDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const query = useAdminUser(id);
  const me = useCurrentUser();
  const isSelf = me?.id === id;
  const toggleStatus = useUpdateUserStatus();
  const remove = useDeleteUser();
  const [rolesOpen, setRolesOpen] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-6">
      <Link to="/admin/usuarios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a usuarios
      </Link>

      <QueryBoundary isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
        {query.data ? (
          <>
            <PageHeader
              title={query.data.name}
              description={query.data.email}
              actions={
                <>
                  <LinkButton to={`/admin/usuarios/${id}/editar`} variant="outline">
                    <Pencil />
                    Editar
                  </LinkButton>
                  <Button variant="outline" onClick={() => setRolesOpen(true)}>
                    <ShieldCheck />
                    Roles
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isSelf}
                    title={isSelf ? 'No puedes desactivar tu propia cuenta' : undefined}
                    onClick={() => setConfirmStatus(true)}
                  >
                    {query.data.is_active ? <UserX /> : <UserCheck />}
                    {query.data.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isSelf}
                    title={isSelf ? 'No puedes eliminar tu propia cuenta' : undefined}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                    Eliminar
                  </Button>
                </>
              }
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Datos de la cuenta</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Avatar name={query.data.name} />
                    <StatusBadge name={query.data.is_active ? 'active' : 'inactive'} label={query.data.is_active ? 'Activo' : 'Inactivo'} />
                  </div>
                  <Info label="Teléfono" value={query.data.phone} />
                  <Info label="Correo verificado" value={query.data.email_verified_at ? formatDateTime(query.data.email_verified_at) : 'No verificado'} />
                  <Info label="Alta" value={query.data.created_at ? formatDateTime(query.data.created_at) : null} />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {query.data.roles.map((role) => (
                        <Badge key={role.name} variant="secondary">
                          {role.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {query.data.business ? (
                    <>
                      <p className="font-medium">{query.data.business.name}</p>
                      <Link to={`/admin/negocios/${query.data.business.id}`} className="text-primary hover:underline">
                        Ver negocio
                      </Link>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Esta cuenta no tiene negocio asociado.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <UserRolesDialog open={rolesOpen} onOpenChange={setRolesOpen} user={query.data} />
            <ConfirmDialog
              open={confirmStatus}
              onOpenChange={setConfirmStatus}
              title={query.data.is_active ? '¿Desactivar esta cuenta?' : '¿Activar esta cuenta?'}
              description={
                query.data.is_active
                  ? 'El usuario no podrá iniciar sesión hasta que la actives de nuevo.'
                  : 'El usuario podrá volver a iniciar sesión.'
              }
              confirmLabel={query.data.is_active ? 'Desactivar' : 'Activar'}
              destructive={query.data.is_active}
              isPending={toggleStatus.isPending}
              onConfirm={() =>
                toggleStatus.mutate(
                  { id, isActive: !query.data.is_active },
                  { onSuccess: () => setConfirmStatus(false) },
                )
              }
            />
            <ConfirmDialog
              open={confirmDelete}
              onOpenChange={setConfirmDelete}
              title="¿Eliminar este usuario?"
              description="Se eliminará la cuenta y su acceso. Esta acción no se puede deshacer."
              confirmLabel="Eliminar usuario"
              isPending={remove.isPending}
              onConfirm={() => remove.mutate(id, { onSuccess: () => navigate('/admin/usuarios', { replace: true }) })}
            />
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value || '—'}</p>
    </div>
  );
}
