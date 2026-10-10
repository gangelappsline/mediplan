import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { BusinessEditDialog } from '@/features/admin/components/BusinessEditDialog';
import { useAdminBusiness, useDeleteBusiness, useUpdateBusinessStatus } from '@/features/admin/hooks';
import { Avatar } from '@/shared/components/Avatar';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { SelectField } from '@/shared/components/form/Fields';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { Business, BusinessStatusName } from '@/types';

const STATUS_OPTIONS: ReadonlyArray<{ value: BusinessStatusName; label: string }> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
];

const statusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended']),
});

export function AdminBusinessDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const query = useAdminBusiness(id);
  const remove = useDeleteBusiness();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-6">
      <Link to="/admin/negocios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a negocios
      </Link>

      <QueryBoundary isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
        {query.data ? (
          <>
            <PageHeader
              title={query.data.name}
              description={query.data.city ?? query.data.email ?? undefined}
              actions={
                <>
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Pencil />
                    Editar
                  </Button>
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
                  <CardTitle>Información</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Avatar name={query.data.name} />
                    <StatusBadge name={query.data.status.name} label={query.data.status.label} />
                  </div>
                  <Info label="Correo" value={query.data.email ?? null} />
                  <Info label="Teléfono" value={query.data.phone ?? null} />
                  <Info label="Dirección" value={query.data.address ?? null} />
                  <Info label="Ciudad" value={query.data.city ?? null} />
                  <div className="sm:col-span-2">
                    <Info label="Descripción" value={query.data.description ?? null} />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Propietario</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {query.data.owner ? (
                      <>
                        <p className="font-medium">{query.data.owner.name}</p>
                        <p className="text-muted-foreground">{query.data.owner.email}</p>
                        <Link to={`/admin/usuarios/${query.data.owner.id}`} className="text-primary hover:underline">
                          Ver usuario
                        </Link>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Sin propietario asignado.</p>
                    )}
                  </CardContent>
                </Card>

                <StatusCard business={query.data} />

                <Card>
                  <CardContent className="grid grid-cols-3 gap-2 p-4 text-center text-sm">
                    <Counter label="Clientes" value={query.data.clients_count} />
                    <Counter label="Leads" value={query.data.leads_count} />
                    <Counter label="Citas" value={query.data.appointments_count} />
                  </CardContent>
                </Card>
              </div>
            </div>

            <BusinessEditDialog open={editing} onOpenChange={setEditing} business={query.data} />
            <ConfirmDialog
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
              title="¿Eliminar este negocio?"
              description="Se eliminarán sus datos asociados según las reglas de la plataforma. Esta acción no se puede deshacer."
              confirmLabel="Eliminar negocio"
              isPending={remove.isPending}
              onConfirm={() => remove.mutate(id, { onSuccess: () => navigate('/admin/negocios', { replace: true }) })}
            />
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}

/** Cambio de estado del negocio (`PATCH /admin/businesses/{business}/status`). */
function StatusCard({ business }: { business: Business }) {
  const update = useUpdateBusinessStatus();

  const form = useAppForm({
    schema: statusSchema,
    defaultValues: { status: business.status.name as BusinessStatusName },
    onSubmit: async (values) => {
      if (values.status === business.status.name) return;
      try {
        await update.mutateAsync({ id: business.id, status: values.status });
      } catch {
        // Notificado por el hook.
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="status">
            {(field) => <SelectField field={field} label="Estado del negocio" options={STATUS_OPTIONS} />}
          </form.Field>
          <div className="flex justify-end">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting || update.isPending}>
                  Actualizar estado
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-line">{value || '—'}</p>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <p className="text-xl font-bold tabular-nums">{value ?? 0}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
