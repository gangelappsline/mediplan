import { Link } from 'react-router-dom';

import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDateTime } from '@/shared/lib/format';
import type { Appointment } from '@/types';

/** Fila de cita del cliente con enlace a su detalle. */
export function AppointmentCardLink({ appointment }: { appointment: Appointment }) {
  return (
    <Link
      to={`/cuenta/citas/${appointment.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{appointment.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {formatDateTime(appointment.starts_at)}
          {appointment.business?.name ? ` · ${appointment.business.name}` : ''}
        </p>
      </div>
      <StatusBadge name={appointment.status.name} label={appointment.status.label} />
    </Link>
  );
}
