import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { clientApi, type ClientAppointmentsQuery, type CancelAppointmentPayload } from '@/features/cliente/api';
import { getErrorMessage } from '@/shared/api/http';

export const clientKeys = {
  all: ['client'] as const,
  dashboard: () => [...clientKeys.all, 'dashboard'] as const,
  appointments: (query: ClientAppointmentsQuery) => [...clientKeys.all, 'appointments', query] as const,
  appointment: (id: number) => [...clientKeys.all, 'appointments', 'detail', id] as const,
};

export const clientDashboardQuery = () =>
  queryOptions({ queryKey: clientKeys.dashboard(), queryFn: () => clientApi.dashboard() });

export const clientAppointmentsQuery = (query: ClientAppointmentsQuery) =>
  queryOptions({
    queryKey: clientKeys.appointments(query),
    queryFn: () => clientApi.appointments(query),
    placeholderData: keepPreviousData,
  });

export const clientAppointmentQuery = (id: number) =>
  queryOptions({
    queryKey: clientKeys.appointment(id),
    queryFn: () => clientApi.appointment(id),
    enabled: Number.isFinite(id),
  });

export const useClientDashboard = () => useQuery(clientDashboardQuery());
export const useClientAppointments = (query: ClientAppointmentsQuery) => useQuery(clientAppointmentsQuery(query));
export const useClientAppointment = (id: number) => useQuery(clientAppointmentQuery(id));

export function useCancelAppointment(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelAppointmentPayload) => clientApi.cancelAppointment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Cita cancelada');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
