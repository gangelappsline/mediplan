import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarPlus,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { UserRolesDialog } from '@/features/admin/components/UserRolesDialog';
import { useAdminUser, useDeleteUser, useUpdateUserStatus } from '@/features/admin/hooks';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Avatar } from '@/shared/components/Avatar';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { InfoList, InfoRow } from '@/shared/components/InfoList';
import { LinkButton } from '@/shared/components/LinkButton';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { DetailSkeleton } from '@/shared/components/ui/skeleton';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { fadeUp } from '@/shared/lib/animations';
import { formatDateTime, timeAgo } from '@/shared/lib/format';
import type { User } from '@/types';

/** Detalle de un usuario de la plataforma (`GET /admin/users/{user}`). */
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
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Link
          to="/admin/usuarios"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Volver a usuarios
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
          <UserDetail
            user={query.data}
            isSelf={isSelf}
            onEditRoles={() => setRolesOpen(true)}
            onToggleStatus={() => setConfirmStatus(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        ) : null}
      </QueryBoundary>

      {query.data ? (
        <>
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
              toggleStatus.mutate({ id, isActive: !query.data.is_active }, { onSuccess: () => setConfirmStatus(false) })
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
    </div>
  );
}

interface UserDetailProps {
  user: User;
  isSelf: boolean;
  onEditRoles: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function UserDetail({ user, isSelf, onEditRoles, onToggleStatus, onDelete }: UserDetailProps) {
  return (
    <>
      {/* ------------------------------- Portada ------------------------------- */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="surface-glow relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }}>
              <Avatar name={user.name} size="lg" />
            </motion.div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{user.name}</h1>
                <StatusBadge name={user.is_active ? 'active' : 'inactive'} label={user.is_active ? 'Activo' : 'Inactivo'} />
                {isSelf ? <Badge variant="secondary">Tu cuenta</Badge> : null}
              </div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {user.roles.map((role) => (
                  <Badge key={role.name} variant="outline" className="gap-1 font-normal">
                    <ShieldCheck className="size-3 text-primary" />
                    {role.label}
                  </Badge>
                ))}
                {user.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Sin roles asignados</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LinkButton to={`/admin/usuarios/${user.id}/editar`} variant="outline">
              <Pencil />
              Editar
            </LinkButton>
            <Button type="button" variant="outline" onClick={onEditRoles}>
              <ShieldCheck />
              Roles
            </Button>
            <Tooltip
              content={isSelf ? 'No puedes cambiar el estado de tu propia cuenta' : user.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
            >
              <span className="inline-flex">
                <Button type="button" variant="outline" disabled={isSelf} onClick={onToggleStatus}>
                  {user.is_active ? <UserX /> : <UserCheck />}
                  <span className="hidden sm:inline">{user.is_active ? 'Desactivar' : 'Activar'}</span>
                </Button>
              </span>
            </Tooltip>
            <Tooltip content={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar cuenta'}>
              <span className="inline-flex">
                <Button type="button" variant="destructive" disabled={isSelf} onClick={onDelete}>
                  <Trash2 />
                  <span className="hidden sm:inline">Eliminar</span>
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>
      </motion.section>

      {/* -------------------------------- Cuerpo -------------------------------- */}
      <StaggerList className="grid gap-6 lg:grid-cols-3">
        <StaggerItem className="lg:col-span-2">
          <Card className="h-full gap-4 py-5">
            <CardHeader>
              <CardTitle>Datos de la cuenta</CardTitle>
              <CardDescription>Información devuelta por la API para el usuario #{user.id}.</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoList>
                <InfoRow label="Nombre" icon={ShieldCheck} value={user.name} />
                <InfoRow label="Correo" icon={Mail} value={user.email} />
                <InfoRow label="Teléfono" icon={Phone} value={user.phone} empty="Sin teléfono" />
                <InfoRow
                  label="Correo verificado"
                  icon={BadgeCheck}
                  value={user.email_verified_at ? formatDateTime(user.email_verified_at) : null}
                  empty="No verificado"
                  tone={user.email_verified_at ? 'success' : 'danger'}
                />
                <InfoRow
                  label="Alta"
                  icon={CalendarPlus}
                  value={user.created_at ? formatDateTime(user.created_at) : null}
                  hint={user.created_at ? timeAgo(user.created_at) : undefined}
                  empty="Sin fecha"
                />
                <InfoRow
                  label="Negocio"
                  icon={Store}
                  value={user.business?.name ?? null}
                  to={user.business ? `/admin/negocios/${user.business.id}` : undefined}
                  empty="Sin negocio asociado"
                />
              </InfoList>
            </CardContent>
          </Card>
        </StaggerItem>

        <div className="space-y-6">
          <StaggerItem>
            <Card className="gap-4 py-5">
              <CardHeader>
                <CardTitle>Acceso</CardTitle>
                <CardDescription>Estado de la cuenta y permisos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3">
                  <div>
                    <p className="font-medium">{user.is_active ? 'Cuenta activa' : 'Cuenta desactivada'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.is_active ? 'Puede iniciar sesión con normalidad.' : 'No puede iniciar sesión.'}
                    </p>
                  </div>
                  <Tooltip content={isSelf ? 'No puedes cambiar tu propia cuenta' : 'Cambiar estado'}>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        size="sm"
                        variant={user.is_active ? 'outline' : 'default'}
                        disabled={isSelf}
                        onClick={onToggleStatus}
                      >
                        {user.is_active ? <UserX /> : <UserCheck />}
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </span>
                  </Tooltip>
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={onEditRoles}>
                  <ShieldCheck />
                  Reemplazar roles
                </Button>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="gap-4 py-5">
              <CardHeader>
                <CardTitle>Negocio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {user.business ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.business.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.business.name}</p>
                        <StatusBadge name={user.business.status.name} label={user.business.status.label} />
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/admin/negocios/${user.business.id}`}>
                        <Building2 />
                        Ver negocio
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">Esta cuenta no tiene negocio asociado.</p>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </StaggerList>
    </>
  );
}
