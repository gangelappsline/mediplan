import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CircleAlert,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Store,
  Target,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { BusinessEditDialog } from '@/features/admin/components/BusinessEditDialog';
import { BusinessEcosystemMap } from '@/features/admin/components/BusinessEcosystemMap';
import { useAdminBusiness, useDeleteBusiness, useUpdateBusinessStatus } from '@/features/admin/hooks';
import { Avatar } from '@/shared/components/Avatar';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { InfoList, InfoRow } from '@/shared/components/InfoList';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Segmented } from '@/shared/components/ui/segmented';
import { DetailSkeleton } from '@/shared/components/ui/skeleton';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { fadeUp, tweenFast } from '@/shared/lib/animations';
import { formatDate, formatDateTime, timeAgo } from '@/shared/lib/format';
import type { Business, BusinessStatusName } from '@/types';

const STATUS_OPTIONS: ReadonlyArray<{ value: BusinessStatusName; label: string }> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
];

const STATUS_DESCRIPTION: Record<BusinessStatusName, string> = {
  pending: 'En revisión: la clínica todavía no opera con normalidad.',
  active: 'Activo: puede agendar citas y usar el CRM sin restricciones.',
  suspended: 'Suspendido: la operación queda bloqueada hasta que lo reactives.',
};

const statusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended']),
});

/** Detalle administrativo de un negocio (`GET /admin/businesses/{business}`). */
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
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Link
          to="/admin/negocios"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Volver a negocios
        </Link>
      </motion.div>

      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        skeleton={<DetailSkeleton blocks={2} />}
        isFetching={query.isFetching}
      >
        {query.data ? (
          <>
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="surface-glow relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <Avatar name={query.data.name} size="lg" />
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{query.data.name}</h1>
                      <StatusBadge name={query.data.status.name} label={query.data.status.label} />
                    </div>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {query.data.city ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          {query.data.city}
                        </span>
                      ) : null}
                      {query.data.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5" />
                          {query.data.email}
                        </span>
                      ) : null}
                      {query.data.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5" />
                          {query.data.phone}
                        </span>
                      ) : null}
                      {query.data.created_at ? (
                        <span className="inline-flex items-center gap-1.5">
                          Alta {formatDate(query.data.created_at)} · {timeAgo(query.data.created_at)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil />
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 />
                    Eliminar
                  </Button>
                </div>
              </div>
            </motion.section>

            <StaggerList className="grid gap-4 sm:grid-cols-3">
              <StaggerItem>
                <StatCard
                  title="Clientes"
                  value={query.data.clients_count ?? 0}
                  hint="Pacientes registrados en la clínica"
                  icon={Users}
                  tone="success"
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard title="Leads" value={query.data.leads_count ?? 0} hint="Prospectos captados" icon={Target} tone="warn" />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  title="Citas"
                  value={query.data.appointments_count ?? 0}
                  hint="Agendadas hasta ahora"
                  icon={CalendarCheck}
                  tone="violet"
                />
              </StaggerItem>
            </StaggerList>

            <div className="grid gap-6 lg:grid-cols-3">
              <StaggerList className="space-y-6 lg:col-span-2">
                <StaggerItem>
                  <Card className="gap-4 py-5">
                    <CardHeader>
                      <CardTitle>Información</CardTitle>
                      <CardDescription>Datos del negocio #{query.data.id}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InfoList>
                        <InfoRow label="Nombre" icon={Store} value={query.data.name} />
                        <InfoRow label="Correo" icon={Mail} value={query.data.email} empty="Sin correo" />
                        <InfoRow label="Teléfono" icon={Phone} value={query.data.phone} empty="Sin teléfono" />
                        <InfoRow label="Dirección" icon={MapPin} value={query.data.address} empty="Sin dirección" />
                        <InfoRow label="Ciudad" icon={Building2} value={query.data.city} empty="Sin ciudad" />
                        <InfoRow
                          label="Actualizado"
                          value={query.data.updated_at ? formatDateTime(query.data.updated_at) : null}
                          hint={query.data.updated_at ? timeAgo(query.data.updated_at) : undefined}
                          empty="Sin registros"
                        />
                      </InfoList>
                      {query.data.description ? (
                        <div className="mt-4 space-y-1.5">
                          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Descripción</p>
                          <p className="rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-line">{query.data.description}</p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card className="gap-4 py-5">
                    <CardHeader>
                      <CardTitle>Ecosistema del negocio</CardTitle>
                      <CardDescription>Quién lo administra y qué volumen maneja.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BusinessEcosystemMap business={query.data} />
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerList>

              <div className="space-y-6">
                <StatusCard business={query.data} />

                <Card className="gap-4 py-5">
                  <CardHeader>
                    <CardTitle>Propietario</CardTitle>
                    <CardDescription>Cuenta que administra este negocio.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {query.data.owner ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Avatar name={query.data.owner.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{query.data.owner.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{query.data.owner.email}</p>
                          </div>
                          <StatusBadge
                            name={query.data.owner.is_active ? 'active' : 'inactive'}
                            label={query.data.owner.is_active ? 'Activo' : 'Inactivo'}
                          />
                        </div>
                        <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                          <Link to={`/admin/usuarios/${query.data.owner.id}`}>
                            <UserRound />
                            Ver usuario
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <p className="flex items-start gap-2 text-muted-foreground">
                        <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                        Sin propietario asignado.
                      </p>
                    )}
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
    <Card className="gap-4 py-5">
      <CardHeader>
        <CardTitle>Estado</CardTitle>
        <CardDescription>Controla si la clínica puede operar.</CardDescription>
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
            {(field) => (
              <div className="space-y-3">
                <Segmented
                  options={STATUS_OPTIONS}
                  value={field.state.value as BusinessStatusName}
                  onChange={(value) => field.handleChange(value)}
                  ariaLabel="Estado del negocio"
                  className="w-full [&>button]:flex-1"
                />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={field.state.value}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={tweenFast}
                    className="flex items-start gap-2 rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground"
                  >
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                    {STATUS_DESCRIPTION[field.state.value as BusinessStatusName]}
                  </motion.p>
                </AnimatePresence>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.isSubmitting, state.values.status] as const}>
            {([isSubmitting, currentStatus]) => (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Actual:{' '}
                  <span className="font-medium text-foreground">
                    {STATUS_OPTIONS.find((option) => option.value === business.status.name)?.label ?? business.status.label}
                  </span>
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting || update.isPending || currentStatus === business.status.name}
                >
                  Guardar estado
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
