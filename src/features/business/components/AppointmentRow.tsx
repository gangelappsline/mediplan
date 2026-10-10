import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatTime } from '@/shared/lib/format';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { Appointment } from '@/types';

/** Fila compacta de cita, enlazada a su detalle. */
export function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <Link
      to={`/dashboard/agenda/citas/${appointment.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex w-20 shrink-0 flex-col items-start text-sm font-semibold tabular-nums">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5 text-muted-foreground" aria-hidden />
          {formatTime(appointment.starts_at)}
        </span>
        <span className="text-xs font-normal text-muted-foreground">{formatTime(appointment.ends_at)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{appointment.title}</p>
        <p className="truncate text-sm text-muted-foreground">{appointment.client?.name ?? 'Sin cliente'}</p>
      </div>
      <StatusBadge name={appointment.status.name} label={appointment.status.label} />
    </Link>
  );
}
