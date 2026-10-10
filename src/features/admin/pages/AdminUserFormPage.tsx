import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAdminUser } from '@/features/admin/hooks';
import { UserForm } from '@/features/admin/components/UserForm';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { Card, CardContent } from '@/shared/components/ui/card';

/** Alta (`/admin/usuarios/nuevo`) y edición (`/admin/usuarios/:id/editar`). */
export function AdminUserFormPage() {
  const params = useParams();
  const isEdit = Boolean(params.id);
  const id = Number(params.id);
  const navigate = useNavigate();
  const user = useAdminUser(isEdit ? id : Number.NaN);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={isEdit ? `/admin/usuarios/${id}` : '/admin/usuarios'} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver
      </Link>
      <PageHeader title={isEdit ? 'Editar usuario' : 'Nuevo usuario'} description="Los campos marcados con * son obligatorios." />
      <Card>
        <CardContent className="p-6">
          {isEdit ? (
            <QueryBoundary isLoading={user.isLoading} error={user.error} onRetry={() => void user.refetch()}>
              {user.data ? (
                <UserForm
                  user={user.data}
                  onCancel={() => navigate(`/admin/usuarios/${id}`)}
                  onSaved={() => navigate(`/admin/usuarios/${id}`)}
                />
              ) : null}
            </QueryBoundary>
          ) : (
            <UserForm onCancel={() => navigate('/admin/usuarios')} onSaved={(saved) => navigate(`/admin/usuarios/${saved.id}`)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
