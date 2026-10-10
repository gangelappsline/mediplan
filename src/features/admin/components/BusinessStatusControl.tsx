import { useState } from 'react';

import { useUpdateBusinessStatus } from '@/features/admin/hooks';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import type { Business, BusinessStatusName } from '@/types';

const STATUS_OPTIONS: ReadonlyArray<{ value: BusinessStatusName; label: string; description: string }> = [
  { value: 'pending', label: 'Pendiente', description: 'El negocio queda en revisión antes de operar.' },
  { value: 'active', label: 'Activo', description: 'La clínica puede agendar y usar el CRM con normalidad.' },
  { value: 'suspended', label: 'Suspendido', description: 'Se bloquea la operación del negocio hasta nuevo aviso.' },
];

interface BusinessStatusControlProps {
  business: Business;
  /** Muestra solo la insignia (sin permitir cambios). */
  readOnly?: boolean;
  className?: string;
}

/**
 * Cambio rápido de estado de un negocio. Confirma antes de enviar
 * `PATCH /admin/businesses/{business}/status` con el mismo campo `status`.
 */
export function BusinessStatusControl({ business, readOnly = false, className }: BusinessStatusControlProps) {
  const updateStatus = useUpdateBusinessStatus();
  const [pendingStatus, setPendingStatus] = useState<BusinessStatusName | null>(null);

  const current = STATUS_OPTIONS.find((option) => option.value === business.status.name) ?? null;
  const target = pendingStatus ? (STATUS_OPTIONS.find((option) => option.value === pendingStatus) ?? null) : null;

  if (readOnly || !current) {
    return <span className={className}>{business.status.label}</span>;
  }

  return (
    <>
      <Select
        value={business.status.name}
        onValueChange={(value) => {
          if (value === business.status.name) return;
          setPendingStatus(value as BusinessStatusName);
        }}
      >
        <SelectTrigger size="sm" className={className} aria-label={`Estado del negocio ${business.name}`}>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={
                business.status.name === 'active'
                  ? 'size-2 rounded-full bg-emerald-500'
                  : business.status.name === 'pending'
                    ? 'size-2 rounded-full bg-amber-500'
                    : 'size-2 rounded-full bg-rose-500'
              }
            />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => (open ? null : setPendingStatus(null))}
        title={`¿Cambiar ${business.name} a «${target?.label ?? ''}»?`}
        description={target?.description ?? ''}
        confirmLabel="Cambiar estado"
        destructive={pendingStatus === 'suspended'}
        isPending={updateStatus.isPending}
        onConfirm={() => {
          if (!pendingStatus) return;
          updateStatus.mutate(
            { id: business.id, status: pendingStatus },
            { onSuccess: () => setPendingStatus(null) },
          );
        }}
      />
    </>
  );
}
