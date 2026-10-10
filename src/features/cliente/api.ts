import { cleanQuery, compactPayload, fetchItem, fetchList } from '@/shared/api/resources';
import type { Appointment, AppointmentStatusName, ClientDashboardData, PaginatedResponse } from '@/types';

export type AppointmentScope = 'all' | 'upcoming' | 'past';

export interface ClientAppointmentsQuery {
  scope?: AppointmentScope;
  status?: AppointmentStatusName | '';
  page?: number;
  per_page?: number;
}

export interface CancelAppointmentPayload {
  cancel_reason?: string | null;
}

/** Endpoints del rol cliente (`client`). */
export const clientApi = {
  /** GET /client/dashboard */
  dashboard: () => fetchItem<ClientDashboardData>('/client/dashboard'),

  /** GET /client/appointments?scope&status&per_page */
  appointments: (query: ClientAppointmentsQuery = {}): Promise<PaginatedResponse<Appointment>> =>
    fetchList<Appointment>('/client/appointments', { query: cleanQuery(query) }),

  /** GET /client/appointments/{appointment} */
  appointment: (id: number) => fetchItem<Appointment>(`/client/appointments/${id}`),

  /** PATCH /client/appointments/{appointment}/cancel */
  cancelAppointment: (id: number, payload: CancelAppointmentPayload = {}) =>
    fetchItem<Appointment>(`/client/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: compactPayload(payload),
    }),
};
