import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { LeadForm } from '@/features/business/components/LeadForm';
import { useLead } from '@/features/business/hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { Card, CardContent } from '@/shared/components/ui/card';

/** Alta (`/dashboard/pipeline/nuevo`) y edición (`/dashboard/pipeline/:id/editar`) de lead. */
export function LeadFormPage() {
  const params = useParams();
  const isEdit = Boolean(params.id);
  const id = Number(params.id);
  const navigate = useNavigate();
  const lead = useLead(isEdit ? id : Number.NaN);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={isEdit ? `/dashboard/pipeline/${id}` : '/dashboard/pipeline'} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver
      </Link>
      <PageHeader title={isEdit ? 'Editar lead' : 'Nuevo lead'} description="Necesitas al menos un correo o un teléfono." />
      <Card>
        <CardContent className="p-6">
          {isEdit ? (
            <QueryBoundary isLoading={lead.isLoading} error={lead.error} onRetry={() => void lead.refetch()}>
              {lead.data ? (
                <LeadForm
                  lead={lead.data}
                  onCancel={() => navigate(`/dashboard/pipeline/${id}`)}
                  onSaved={() => navigate(`/dashboard/pipeline/${id}`)}
                />
              ) : null}
            </QueryBoundary>
          ) : (
            <LeadForm onCancel={() => navigate('/dashboard/pipeline')} onSaved={(saved) => navigate(`/dashboard/pipeline/${saved.id}`)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
