import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ClientForm } from '@/features/business/components/ClientForm';
import { useClient } from '@/features/business/hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { Card, CardContent } from '@/shared/components/ui/card';

/** Alta (`/dashboard/clientes/nuevo`) y edición (`/dashboard/clientes/:id/editar`) de cliente. */
export function ClientFormPage() {
  const params = useParams();
  const isEdit = Boolean(params.id);
  const id = Number(params.id);
  const navigate = useNavigate();
  const client = useClient(isEdit ? id : Number.NaN);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={isEdit ? `/dashboard/clientes/${id}` : '/dashboard/clientes'} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver
      </Link>
      <PageHeader
        title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
        description="Los campos marcados con * son obligatorios."
      />
      <Card>
        <CardContent className="p-6">
          {isEdit ? (
            <QueryBoundary isLoading={client.isLoading} error={client.error} onRetry={() => void client.refetch()}>
              {client.data ? (
                <ClientForm
                  client={client.data}
                  onCancel={() => navigate(`/dashboard/clientes/${id}`)}
                  onSaved={() => navigate(`/dashboard/clientes/${id}`)}
                />
              ) : null}
            </QueryBoundary>
          ) : (
            <ClientForm
              onCancel={() => navigate('/dashboard/clientes')}
              onSaved={(saved) => navigate(`/dashboard/clientes/${saved.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
