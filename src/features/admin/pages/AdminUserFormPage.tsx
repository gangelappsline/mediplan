import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { UserForm } from '@/features/admin/components/UserForm';
import { useAdminUser } from '@/features/admin/hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { DetailSkeleton } from '@/shared/components/ui/skeleton';
import { fadeUp } from '@/shared/lib/animations';

/** Alta (`/admin/usuarios/nuevo`) y edición (`/admin/usuarios/:id/editar`). */
export function AdminUserFormPage() {
  const params = useParams();
  const isEdit = Boolean(params.id);
  const id = Number(params.id);
  const navigate = useNavigate();
  const user = useAdminUser(isEdit ? id : Number.NaN);

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Link
          to={isEdit ? `/admin/usuarios/${id}` : '/admin/usuarios'}
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Volver
        </Link>
      </motion.div>

      <PageHeader
        eyebrow={isEdit ? `Usuario #${id}` : 'Alta de cuenta'}
        title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        description="Los campos marcados con * son obligatorios. La vista previa muestra cómo quedará la cuenta."
      />

      {isEdit ? (
        <QueryBoundary
          isLoading={user.isLoading}
          error={user.error}
          onRetry={() => void user.refetch()}
          skeleton={<DetailSkeleton blocks={1} />}
        >
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
    </div>
  );
}
