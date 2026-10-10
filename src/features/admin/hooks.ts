import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  adminApi,
  type AdminBusinessesQuery,
  type AdminLeadsQuery,
  type AdminUsersQuery,
} from '@/features/admin/api';
import { getErrorMessage } from '@/shared/api/http';
import type { AdminBusinessPayload, AdminUserPayload, BusinessStatusName, RoleName } from '@/types';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  users: (query: AdminUsersQuery) => [...adminKeys.all, 'users', query] as const,
  user: (id: number) => [...adminKeys.all, 'users', 'detail', id] as const,
  businesses: (query: AdminBusinessesQuery) => [...adminKeys.all, 'businesses', query] as const,
  business: (id: number) => [...adminKeys.all, 'businesses', 'detail', id] as const,
  leads: (query: AdminLeadsQuery) => [...adminKeys.all, 'leads', query] as const,
  roles: () => [...adminKeys.all, 'roles'] as const,
};

export const adminDashboardQuery = () =>
  queryOptions({ queryKey: adminKeys.dashboard(), queryFn: () => adminApi.dashboard() });

export const adminUsersQuery = (query: AdminUsersQuery) =>
  queryOptions({
    queryKey: adminKeys.users(query),
    queryFn: () => adminApi.users.list(query),
    placeholderData: keepPreviousData,
  });

export const adminUserQuery = (id: number) =>
  queryOptions({ queryKey: adminKeys.user(id), queryFn: () => adminApi.users.show(id), enabled: Number.isFinite(id) });

export const adminBusinessesQuery = (query: AdminBusinessesQuery) =>
  queryOptions({
    queryKey: adminKeys.businesses(query),
    queryFn: () => adminApi.businesses.list(query),
    placeholderData: keepPreviousData,
  });

export const adminBusinessQuery = (id: number) =>
  queryOptions({
    queryKey: adminKeys.business(id),
    queryFn: () => adminApi.businesses.show(id),
    enabled: Number.isFinite(id),
  });

export const adminLeadsQuery = (query: AdminLeadsQuery) =>
  queryOptions({
    queryKey: adminKeys.leads(query),
    queryFn: () => adminApi.leads.list(query),
    placeholderData: keepPreviousData,
  });

export const adminRolesQuery = () => queryOptions({ queryKey: adminKeys.roles(), queryFn: () => adminApi.roles() });

export const useAdminDashboard = () => useQuery(adminDashboardQuery());
export const useAdminUsers = (query: AdminUsersQuery) => useQuery(adminUsersQuery(query));
export const useAdminUser = (id: number) => useQuery(adminUserQuery(id));
export const useAdminBusinesses = (query: AdminBusinessesQuery) => useQuery(adminBusinessesQuery(query));
export const useAdminBusiness = (id: number) => useQuery(adminBusinessQuery(id));
export const useAdminLeads = (query: AdminLeadsQuery) => useQuery(adminLeadsQuery(query));
export const useAdminRoles = () => useQuery(adminRolesQuery());

/** Mutación genérica: invalida todo el espacio admin y notifica el resultado. */
function useAdminMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  successMessage: string,
  onDone?: (data: TData) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success(successMessage);
      onDone?.(data);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export const useCreateUser = () =>
  useAdminMutation((payload: AdminUserPayload) => adminApi.users.create(payload), 'Usuario creado');

export const useUpdateUser = (id: number) =>
  useAdminMutation((payload: AdminUserPayload) => adminApi.users.update(id, payload), 'Usuario actualizado');

export const useDeleteUser = () =>
  useAdminMutation((id: number) => adminApi.users.remove(id), 'Usuario eliminado');

export const useUpdateUserStatus = () =>
  useAdminMutation(
    ({ id, isActive }: { id: number; isActive: boolean }) => adminApi.users.updateStatus(id, isActive),
    'Estado del usuario actualizado',
  );

export const useReplaceUserRoles = () =>
  useAdminMutation(
    ({ id, roles }: { id: number; roles: RoleName[] }) => adminApi.users.replaceRoles(id, roles),
    'Roles actualizados',
  );

export const useUpdateBusiness = (id: number) =>
  useAdminMutation((payload: AdminBusinessPayload) => adminApi.businesses.update(id, payload), 'Negocio actualizado');

export const useDeleteBusiness = () =>
  useAdminMutation((id: number) => adminApi.businesses.remove(id), 'Negocio eliminado');

export const useUpdateBusinessStatus = () =>
  useAdminMutation(
    ({ id, status }: { id: number; status: BusinessStatusName }) => adminApi.businesses.updateStatus(id, status),
    'Estado del negocio actualizado',
  );
