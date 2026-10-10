import { cleanQuery, compactPayload, fetchItem, fetchList, fetchMessage } from '@/shared/api/resources';
import type {
  AdminBusinessPayload,
  AdminDashboardData,
  AdminUserPayload,
  Business,
  BusinessStatusName,
  Lead,
  MessageResponse,
  RoleCatalogItem,
  RoleName,
  User,
} from '@/types';

export interface AdminUsersQuery {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AdminBusinessesQuery {
  search?: string;
  status?: BusinessStatusName | '';
  page?: number;
  per_page?: number;
}

export interface AdminLeadsQuery {
  search?: string;
  status?: string;
  business_id?: number;
  page?: number;
  per_page?: number;
}

/** Endpoints del rol administrador (`admin`). */
export const adminApi = {
  /** GET /admin/dashboard */
  dashboard: () => fetchItem<AdminDashboardData>('/admin/dashboard'),

  users: {
    /** GET /admin/users */
    list: (query: AdminUsersQuery = {}) => fetchList<User>('/admin/users', { query: cleanQuery(query) }),
    /** GET /admin/users/{user} */
    show: (id: number) => fetchItem<User>(`/admin/users/${id}`),
    /** POST /admin/users */
    create: (payload: AdminUserPayload) =>
      fetchItem<User>('/admin/users', { method: 'POST', body: compactPayload(payload) }),
    /** PUT /admin/users/{user} (el campo `role` añade un rol) */
    update: (id: number, payload: AdminUserPayload) =>
      fetchItem<User>(`/admin/users/${id}`, { method: 'PUT', body: compactPayload(payload) }),
    /** DELETE /admin/users/{user} */
    remove: (id: number) => fetchMessage(`/admin/users/${id}`, { method: 'DELETE' }),
    /** PATCH /admin/users/{user}/status */
    updateStatus: (id: number, isActive: boolean) =>
      fetchItem<User>(`/admin/users/${id}/status`, { method: 'PATCH', body: { is_active: isActive } }),
    /** PUT /admin/users/{user}/roles (reemplaza todos los roles) */
    replaceRoles: (id: number, roles: RoleName[]) =>
      fetchItem<User>(`/admin/users/${id}/roles`, { method: 'PUT', body: { roles } }),
  },

  businesses: {
    /** GET /admin/businesses */
    list: (query: AdminBusinessesQuery = {}) =>
      fetchList<Business>('/admin/businesses', { query: cleanQuery(query) }),
    /** GET /admin/businesses/{business} */
    show: (id: number) => fetchItem<Business>(`/admin/businesses/${id}`),
    /** PUT /admin/businesses/{business} */
    update: (id: number, payload: AdminBusinessPayload) =>
      fetchItem<Business>(`/admin/businesses/${id}`, { method: 'PUT', body: compactPayload(payload) }),
    /** DELETE /admin/businesses/{business} */
    remove: (id: number): Promise<MessageResponse> => fetchMessage(`/admin/businesses/${id}`, { method: 'DELETE' }),
    /** PATCH /admin/businesses/{business}/status */
    updateStatus: (id: number, status: BusinessStatusName) =>
      fetchItem<Business>(`/admin/businesses/${id}/status`, { method: 'PATCH', body: { status } }),
  },

  leads: {
    /** GET /admin/leads */
    list: (query: AdminLeadsQuery = {}) => fetchList<Lead>('/admin/leads', { query: cleanQuery(query) }),
  },

  /** GET /admin/roles */
  roles: () => fetchItem<RoleCatalogItem[]>('/admin/roles'),
};
