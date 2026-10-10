import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/shared/api/http';
import {
  businessApi,
  type AppointmentListQuery,
  type ClientListQuery,
  type LeadListQuery,
} from '@/features/business/api';
import type {
  AppointmentPayload,
  AppointmentStatusPayload,
  BusinessProfilePayload,
  BusinessSettingsPayload,
  ClientPayload,
  ConvertLeadPayload,
  LeadPayload,
  LeadStatusPayload,
} from '@/types';

/* -------------------------- Query keys / options ------------------------- */

export const businessKeys = {
  all: ['business'] as const,
  profile: () => [...businessKeys.all, 'profile'] as const,
  settings: () => [...businessKeys.all, 'settings'] as const,
  dashboard: () => [...businessKeys.all, 'dashboard'] as const,
  clients: (query?: ClientListQuery) => [...businessKeys.all, 'clients', query ?? {}] as const,
  client: (id: number) => [...businessKeys.all, 'clients', 'detail', id] as const,
  leads: (query?: LeadListQuery) => [...businessKeys.all, 'leads', query ?? {}] as const,
  lead: (id: number) => [...businessKeys.all, 'leads', 'detail', id] as const,
  appointments: (query?: AppointmentListQuery) => [...businessKeys.all, 'appointments', query ?? {}] as const,
  agenda: (from: string, to: string) => [...businessKeys.all, 'agenda', from, to] as const,
  appointment: (id: number) => [...businessKeys.all, 'appointments', 'detail', id] as const,
};

/** Perfil del negocio. Lo usa `BusinessGate` para validar que la cuenta tenga negocio. */
export const businessProfileQuery = () =>
  queryOptions({
    queryKey: businessKeys.profile(),
    queryFn: () => businessApi.getProfile(),
  });

export const businessSettingsQuery = () =>
  queryOptions({
    queryKey: businessKeys.settings(),
    queryFn: () => businessApi.getSettings(),
  });

export const businessDashboardQuery = () =>
  queryOptions({
    queryKey: businessKeys.dashboard(),
    queryFn: () => businessApi.dashboard(),
  });

export const clientsQuery = (query: ClientListQuery) =>
  queryOptions({
    queryKey: businessKeys.clients(query),
    queryFn: () => businessApi.clients.list(query),
    placeholderData: keepPreviousData,
  });

export const clientQuery = (id: number) =>
  queryOptions({
    queryKey: businessKeys.client(id),
    queryFn: () => businessApi.clients.show(id),
    enabled: Number.isFinite(id),
  });

export const leadsQuery = (query: LeadListQuery) =>
  queryOptions({
    queryKey: businessKeys.leads(query),
    queryFn: () => businessApi.leads.list(query),
    placeholderData: keepPreviousData,
  });

export const leadQuery = (id: number) =>
  queryOptions({
    queryKey: businessKeys.lead(id),
    queryFn: () => businessApi.leads.show(id),
    enabled: Number.isFinite(id),
  });

export const appointmentsQuery = (query: AppointmentListQuery) =>
  queryOptions({
    queryKey: businessKeys.appointments(query),
    queryFn: () => businessApi.appointments.list(query),
    placeholderData: keepPreviousData,
  });

export const agendaQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: businessKeys.agenda(from, to),
    queryFn: () => businessApi.appointments.agenda({ from, to }),
    placeholderData: keepPreviousData,
  });

export const appointmentQuery = (id: number) =>
  queryOptions({
    queryKey: businessKeys.appointment(id),
    queryFn: () => businessApi.appointments.show(id),
    enabled: Number.isFinite(id),
  });

/* ------------------------------ Queries ---------------------------------- */

export const useBusinessProfile = () => useQuery(businessProfileQuery());
export const useBusinessSettings = () => useQuery(businessSettingsQuery());
export const useBusinessDashboard = () => useQuery(businessDashboardQuery());
export const useClients = (query: ClientListQuery) => useQuery(clientsQuery(query));
export const useClient = (id: number) => useQuery(clientQuery(id));
export const useLeads = (query: LeadListQuery) => useQuery(leadsQuery(query));
export const useLead = (id: number) => useQuery(leadQuery(id));
export const useAppointments = (query: AppointmentListQuery) => useQuery(appointmentsQuery(query));
export const useAgenda = (from: string, to: string) => useQuery(agendaQuery(from, to));
export const useAppointment = (id: number) => useQuery(appointmentQuery(id));

/* ----------------------------- Mutations --------------------------------- */

function useBusinessMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  successMessage: string,
  onDone?: (data: TData, vars: TVars) => void,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data, vars) => {
      void client.invalidateQueries({ queryKey: businessKeys.all });
      toast.success(successMessage);
      onDone?.(data, vars);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export const useUpdateBusinessProfile = () =>
  useBusinessMutation((payload: BusinessProfilePayload) => businessApi.updateProfile(payload), 'Perfil actualizado');

export const useUpdateBusinessSettings = () =>
  useBusinessMutation(
    (payload: BusinessSettingsPayload) => businessApi.updateSettings(payload),
    'Configuración guardada',
  );

export const useSaveClient = (id?: number) =>
  useBusinessMutation(
    (payload: ClientPayload) =>
      id ? businessApi.clients.update(id, payload) : businessApi.clients.create(payload),
    id ? 'Cliente actualizado' : 'Cliente creado',
  );

export const useDeleteClient = () =>
  useBusinessMutation((id: number) => businessApi.clients.remove(id), 'Cliente eliminado');

export const useSaveLead = (id?: number) =>
  useBusinessMutation(
    (payload: LeadPayload) => (id ? businessApi.leads.update(id, payload) : businessApi.leads.create(payload)),
    id ? 'Lead actualizado' : 'Lead creado',
  );

export const useDeleteLead = () => useBusinessMutation((id: number) => businessApi.leads.remove(id), 'Lead eliminado');

export const useUpdateLeadStatus = () =>
  useBusinessMutation(
    ({ id, payload }: { id: number; payload: LeadStatusPayload }) => businessApi.leads.updateStatus(id, payload),
    'Estado del lead actualizado',
  );

export const useConvertLead = () =>
  useBusinessMutation(
    ({ id, payload }: { id: number; payload: ConvertLeadPayload }) => businessApi.leads.convert(id, payload),
    'Lead convertido en cliente',
  );

export const useSaveAppointment = (id?: number) =>
  useBusinessMutation(
    (payload: AppointmentPayload) =>
      id ? businessApi.appointments.update(id, payload) : businessApi.appointments.create(payload),
    id ? 'Cita actualizada' : 'Cita agendada',
  );

export const useDeleteAppointment = () =>
  useBusinessMutation((id: number) => businessApi.appointments.remove(id), 'Cita eliminada');

export const useUpdateAppointmentStatus = () =>
  useBusinessMutation(
    ({ id, payload }: { id: number; payload: AppointmentStatusPayload }) =>
      businessApi.appointments.updateStatus(id, payload),
    'Estado de la cita actualizado',
  );
