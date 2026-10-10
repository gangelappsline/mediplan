import {
  appointmentStatusMeta,
  clientSourceMeta,
  clientStatusMeta,
  dealStageMeta,
  taskPriorityMeta,
  taskTypeMeta,
} from '@/features/crm/labels';
import type {
  AppointmentStatus,
  ClientSource,
  ClientStatus,
  DealStage,
  TaskPriority,
  TaskType,
} from '@/features/crm/types';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

/** Badge de estado del cliente (Lead / Activo / Inactivo / VIP). */
function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const meta = clientStatusMeta[status];
  return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
}

/** Chip de origen del cliente con icono. */
function ClientSourceBadge({ source, className }: { source: ClientSource; className?: string }) {
  const meta = clientSourceMeta[source];
  return (
    <Badge variant="outline" className={cn('gap-1 font-normal text-muted-foreground', className)}>
      <meta.icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

/** Badge de etapa del pipeline. */
function DealStageBadge({ stage }: { stage: DealStage }) {
  const meta = dealStageMeta[stage];
  return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
}

/** Badge de prioridad de un seguimiento. */
function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = taskPriorityMeta[priority];
  return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
}

/** Chip de tipo de seguimiento con icono. */
function TaskTypeBadge({ type }: { type: TaskType }) {
  const meta = taskTypeMeta[type];
  return (
    <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
      <meta.icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

/** Badge de estado de una cita. */
function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = appointmentStatusMeta[status];
  return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
}

/** Etiqueta simple del cliente. */
function TagChip({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {label}
    </Badge>
  );
}

export {
  ClientStatusBadge,
  ClientSourceBadge,
  DealStageBadge,
  TaskPriorityBadge,
  TaskTypeBadge,
  AppointmentStatusBadge,
  TagChip,
};
