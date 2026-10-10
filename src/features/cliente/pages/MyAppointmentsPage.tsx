import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

import { AppointmentCardLink } from '@/features/cliente/components/AppointmentCardLink';
import { useClientAppointments } from '@/features/cliente/hooks';
import type { AppointmentScope } from '@/features/cliente/api';
import { APPOINTMENT_STATUS_OPTIONS } from '@/features/business/labels';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { QueryBoundary } from '@/shared/components/QueryState';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import type { AppointmentStatusName } from '@/types';

const ALL = 'all';

const SCOPES: ReadonlyArray<{ value: AppointmentScope; label: string }> = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Pasadas' },
  { value: 'all', label: 'Todas' },
];

export function MyAppointmentsPage() {
  const [scope, setScope] = useState<AppointmentScope>('upcoming');
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const appointments = useClientAppointments({
    scope,
    status: status === ALL ? '' : (status as AppointmentStatusName),
    page,
    per_page: 15,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mis citas" description="Consulta y gestiona tus citas en cualquier negocio.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border p-1">
            {SCOPES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={scope === item.value}
                onClick={() => {
                  setScope(item.value);
                  setPage(1);
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  scope === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="w-56">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los estados</SelectItem>
                {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="space-y-4 p-4">
          <QueryBoundary
            isLoading={appointments.isLoading}
            error={appointments.error}
            onRetry={() => void appointments.refetch()}
            isEmpty={appointments.data?.data.length === 0}
            emptyState={<EmptyState icon={CalendarDays} title="No hay citas en esta vista" description="Prueba con otro filtro." />}
          >
            <div className="space-y-2">
              {appointments.data?.data.map((appointment) => (
                <AppointmentCardLink key={appointment.id} appointment={appointment} />
              ))}
            </div>
            <Pagination meta={appointments.data?.meta} onPageChange={setPage} />
          </QueryBoundary>
        </CardContent>
      </Card>
    </div>
  );
}
