import { ArrowLeft, ArrowRightLeft, Pencil, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ConvertLeadDialog } from '@/features/business/components/ConvertLeadDialog';
import { LeadStatusDialog } from '@/features/business/components/LeadStatusDialog';
import { useDeleteLead, useLead } from '@/features/business/hooks';
import { LEAD_STATUS_LABEL } from '@/features/business/labels';
import { LinkButton } from '@/shared/components/LinkButton';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDateTime, formatMoney, formatRelativeDay } from '@/shared/lib/format';

export function LeadDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const query = useLead(id);
  const remove = useDeleteLead();
  const [changingStatus, setChangingStatus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-6">
      <Link to="/dashboard/pipeline" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver al pipeline
      </Link>

      <QueryBoundary isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
        {query.data ? (
          <>
            <PageHeader
              title={query.data.name}
              description={query.data.company ?? query.data.email ?? query.data.phone ?? undefined}
              actions={
                <>
                  <Button variant="outline" onClick={() => setChangingStatus(true)}>
                    <ArrowRightLeft />
                    Cambiar estado
                  </Button>
                  {query.data.converted_at ? null : (
                    <Button onClick={() => setConverting(true)}>
                      <UserPlus />
                      Convertir en cliente
                    </Button>
                  )}
                  <LinkButton to={`/dashboard/pipeline/${id}/editar`} variant="outline">
                    <Pencil />
                    Editar
                  </LinkButton>
                  <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 />
                    Eliminar
                  </Button>
                </>
              }
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <StatusBadge
                      name={query.data.status.name}
                      label={LEAD_STATUS_LABEL[query.data.status.name as keyof typeof LEAD_STATUS_LABEL] ?? query.data.status.label}
                    />
                  </div>
                  <Info label="Valor estimado" value={query.data.estimated_value !== null ? formatMoney(query.data.estimated_value) : null} />
                  <Info label="Correo" value={query.data.email} />
                  <Info label="Teléfono" value={query.data.phone} />
                  <Info label="Origen" value={query.data.source} />
                  <Info label="Asignado a" value={query.data.assigned_to?.name ?? null} />
                  <Info
                    label="Próximo seguimiento"
                    value={query.data.follow_up_at ? `${formatRelativeDay(query.data.follow_up_at)} · ${formatDateTime(query.data.follow_up_at)}` : null}
                  />
                  <Info label="Contactado" value={query.data.contacted_at ? formatDateTime(query.data.contacted_at) : null} />
                  <div className="sm:col-span-2">
                    <Info label="Notas" value={query.data.notes} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {query.data.converted_at && query.data.converted_client ? (
                    <>
                      <p className="text-emerald-700 dark:text-emerald-300">
                        Convertido el {formatDateTime(query.data.converted_at)}
                      </p>
                      <Link to={`/dashboard/clientes/${query.data.converted_client.id}`} className="text-primary hover:underline">
                        Ver cliente: {query.data.converted_client.name}
                      </Link>
                    </>
                  ) : query.data.converted_at ? (
                    <p className="text-emerald-700 dark:text-emerald-300">Convertido el {formatDateTime(query.data.converted_at)}</p>
                  ) : (
                    <p className="text-muted-foreground">Este lead aún no es cliente.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <LeadStatusDialog open={changingStatus} onOpenChange={setChangingStatus} lead={query.data} />
            {converting ? (
              <ConvertLeadDialog
                open={converting}
                onOpenChange={setConverting}
                lead={query.data}
                onConverted={(client) => navigate(`/dashboard/clientes/${client.id}`)}
              />
            ) : null}
            <ConfirmDialog
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
              title="¿Eliminar este lead?"
              description="Se eliminará el lead. Esta acción no se puede deshacer."
              confirmLabel="Eliminar lead"
              isPending={remove.isPending}
              onConfirm={() => remove.mutate(id, { onSuccess: () => navigate('/dashboard/pipeline', { replace: true }) })}
            />
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-line">{value || '—'}</p>
    </div>
  );
}
