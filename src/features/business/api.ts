import { cleanQuery, compactPayload, fetchItem, fetchList, fetchMessage } from '@/shared/api/resources';
import type {
  AgendaData,
  Appointment,
  AppointmentPayload,
  AppointmentStatusName,
  AppointmentStatusPayload,
  BusinessDashboardData,
  BusinessProfilePayload,
  BusinessSettings,
  BusinessSettingsPayload,
  Business,
  Client,
  ClientPayload,
  ClientStatusName,
  ConvertLeadPayload,
  Lead,
  LeadPayload,
  LeadStatusName,
  LeadStatusPayload,
} from '@/types';

/* ----------------------------- Query types ----------------------------- */

export interface ClientListQuery {
  search?: string;
  status?: ClientStatusName | '';
  sort?: 'name' | 'created_at' | 'last_appointment_at';
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface LeadListQuery {
  search?: string;
  status?: LeadStatusName | '';
  source?: string;
  /** 1 = solo leads abiertos (no ganados ni perdidos). */
  open?: 0 | 1;
  follow_up_from?: string;
  follow_up_to?: string;
  sort?: 'name' | 'created_at' | 'follow_up_at' | 'estimated_value';
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface AppointmentListQuery {
  from?: string;
  to?: string;
  status?: AppointmentStatusName | '';
  client_id?: number;
  page?: number;
  per_page?: number;
}

/* ------------------------------ Endpoints ------------------------------ */

export const businessApi = {
  /** GET /business/dashboard */
  dashboard: () => fetchItem<BusinessDashboardData>('/business/dashboard'),

  /** GET /business/profile */
  getProfile: () => fetchItem<Business>('/business/profile'),
  /** PUT /business/profile */
  updateProfile: (payload: BusinessProfilePayload) =>
    fetchItem<Business>('/business/profile', { method: 'PUT', body: payload }),

  /** GET /business/settings */
  getSettings: () => fetchItem<BusinessSettings>('/business/settings'),
  /** PUT /business/settings */
  updateSettings: (payload: BusinessSettingsPayload) =>
    fetchItem<BusinessSettings>('/business/settings', { method: 'PUT', body: payload }),

  clients: {
    /** GET /business/clients */
    list: (query: ClientListQuery = {}) =>
      fetchList<Client>('/business/clients', { query: cleanQuery(query) }),
    /** GET /business/clients/{client} */
    show: (id: number) => fetchItem<Client>(`/business/clients/${id}`),
    /** POST /business/clients */
    create: (payload: ClientPayload) =>
      fetchItem<Client>('/business/clients', { method: 'POST', body: compactPayload(payload) }),
    /** PUT /business/clients/{client} */
    update: (id: number, payload: Partial<ClientPayload>) =>
      fetchItem<Client>(`/business/clients/${id}`, { method: 'PUT', body: compactPayload(payload) }),
    /** DELETE /business/clients/{client} */
    remove: (id: number) => fetchMessage(`/business/clients/${id}`, { method: 'DELETE' }),
  },

  leads: {
    /** GET /business/leads */
    list: (query: LeadListQuery = {}) =>
      fetchList<Lead>('/business/leads', { query: cleanQuery(query) }),
    /** GET /business/leads/{lead} */
    show: (id: number) => fetchItem<Lead>(`/business/leads/${id}`),
    /** POST /business/leads */
    create: (payload: LeadPayload) =>
      fetchItem<Lead>('/business/leads', { method: 'POST', body: compactPayload(payload) }),
    /** PUT /business/leads/{lead} */
    update: (id: number, payload: Partial<LeadPayload>) =>
      fetchItem<Lead>(`/business/leads/${id}`, { method: 'PUT', body: compactPayload(payload) }),
    /** DELETE /business/leads/{lead} */
    remove: (id: number) => fetchMessage(`/business/leads/${id}`, { method: 'DELETE' }),
    /** PATCH /business/leads/{lead}/status */
    updateStatus: (id: number, payload: LeadStatusPayload) =>
      fetchItem<Lead>(`/business/leads/${id}/status`, {
        method: 'PATCH',
        body: compactPayload(payload),
      }),
    /** POST /business/leads/{lead}/convert */
    convert: (id: number, payload: ConvertLeadPayload = {}) =>
      fetchItem<ConvertLeadResult>(`/business/leads/${id}/convert`, {
        method: 'POST',
        body: compactPayload(payload),
      }),
  },

  appointments: {
    /** GET /business/appointments */
    list: (query: AppointmentListQuery = {}) =>
      fetchList<Appointment>('/business/appointments', { query: cleanQuery(query) }),
    /** GET /business/appointments/agenda?from&to */
    agenda: (query: { from: string; to: string }) =>
      fetchItem<AgendaData>('/business/appointments/agenda', { query: cleanQuery(query) }),
    /** GET /business/appointments/{appointment} */
    show: (id: number) => fetchItem<Appointment>(`/business/appointments/${id}`),
    /** POST /business/appointments */
    create: (payload: AppointmentPayload) =>
      fetchItem<Appointment>('/business/appointments', { method: 'POST', body: compactPayload(payload) }),
    /** PUT /business/appointments/{appointment} */
    update: (id: number, payload: Partial<AppointmentPayload>) =>
      fetchItem<Appointment>(`/business/appointments/${id}`, {
        method: 'PUT',
        body: compactPayload(payload),
      }),
    /** DELETE /business/appointments/{appointment} */
    remove: (id: number) => fetchMessage(`/business/appointments/${id}`, { method: 'DELETE' }),
    /** PATCH /business/appointments/{appointment}/status */
    updateStatus: (id: number, payload: AppointmentStatusPayload) =>
      fetchItem<Appointment>(`/business/appointments/${id}/status`, {
        method: 'PATCH',
        body: compactPayload(payload),
      }),
  },
};

/** Respuesta de conversión: el cliente creado (puede venir envuelto con el lead). */
export type ConvertLeadResult = Client | { lead?: Lead; client: Client };

/** Extrae el cliente creado a partir de la respuesta de conversión. */
export function convertedClient(result: ConvertLeadResult): Client {
  return 'client' in result ? result.client : result;
}
