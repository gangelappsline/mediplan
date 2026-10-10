import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { RequireRole } from '@/features/auth/components/RequireRole';
import { AdminLayout, BusinessLayout, ClientLayout } from '@/features/panel/layouts';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { MarketingLayout } from '@/shared/components/layout/MarketingLayout';
import { RootLayout } from '@/shared/components/layout/RootLayout';

/**
 * Carga perezosa de una página con nombre: cada pantalla se descarga solo
 * cuando se visita por primera vez.
 */
function lazyPage<M extends Record<string, ComponentType>, K extends keyof M & string>(
  load: () => Promise<M>,
  name: K,
) {
  return {
    lazy: async () => {
      const module = await load();
      return { Component: module[name] };
    },
  };
}

/** Rutas del panel de negocio (`/dashboard`, rol `business`). */
const businessRoutes: RouteObject[] = [
  { index: true, ...lazyPage(() => import('@/features/business/pages/BusinessDashboardPage'), 'BusinessDashboardPage') },
  { path: 'agenda', ...lazyPage(() => import('@/features/business/pages/AgendaPage'), 'AgendaPage') },
  {
    path: 'agenda/citas/:id',
    ...lazyPage(() => import('@/features/business/pages/AppointmentDetailPage'), 'AppointmentDetailPage'),
  },
  { path: 'clientes', ...lazyPage(() => import('@/features/business/pages/ClientsPage'), 'ClientsPage') },
  { path: 'clientes/nuevo', ...lazyPage(() => import('@/features/business/pages/ClientFormPage'), 'ClientFormPage') },
  { path: 'clientes/:id', ...lazyPage(() => import('@/features/business/pages/ClientDetailPage'), 'ClientDetailPage') },
  {
    path: 'clientes/:id/editar',
    ...lazyPage(() => import('@/features/business/pages/ClientFormPage'), 'ClientFormPage'),
  },
  { path: 'pipeline', ...lazyPage(() => import('@/features/business/pages/PipelinePage'), 'PipelinePage') },
  { path: 'pipeline/nuevo', ...lazyPage(() => import('@/features/business/pages/LeadFormPage'), 'LeadFormPage') },
  { path: 'pipeline/:id', ...lazyPage(() => import('@/features/business/pages/LeadDetailPage'), 'LeadDetailPage') },
  { path: 'pipeline/:id/editar', ...lazyPage(() => import('@/features/business/pages/LeadFormPage'), 'LeadFormPage') },
  { path: 'seguimientos', ...lazyPage(() => import('@/features/business/pages/FollowUpsPage'), 'FollowUpsPage') },
  { path: 'whatsapp', ...lazyPage(() => import('@/features/whatsapp/pages/WhatsAppPage'), 'WhatsAppPage') },
  { path: 'reportes', ...lazyPage(() => import('@/features/business/pages/ReportsPage'), 'ReportsPage') },
  { path: 'configuracion', ...lazyPage(() => import('@/features/business/pages/SettingsPage'), 'SettingsPage') },
];

/** Rutas del panel de cliente (`/cuenta`, rol `client`). */
const clientRoutes: RouteObject[] = [
  { index: true, ...lazyPage(() => import('@/features/cliente/pages/ClientDashboardPage'), 'ClientDashboardPage') },
  { path: 'citas', ...lazyPage(() => import('@/features/cliente/pages/MyAppointmentsPage'), 'MyAppointmentsPage') },
  {
    path: 'citas/:id',
    ...lazyPage(() => import('@/features/cliente/pages/MyAppointmentDetailPage'), 'MyAppointmentDetailPage'),
  },
];

/** Rutas del panel de administración (`/admin`, rol `admin`). */
const adminRoutes: RouteObject[] = [
  { index: true, ...lazyPage(() => import('@/features/admin/pages/AdminDashboardPage'), 'AdminDashboardPage') },
  { path: 'usuarios', ...lazyPage(() => import('@/features/admin/pages/AdminUsersPage'), 'AdminUsersPage') },
  { path: 'usuarios/nuevo', ...lazyPage(() => import('@/features/admin/pages/AdminUserFormPage'), 'AdminUserFormPage') },
  { path: 'usuarios/:id', ...lazyPage(() => import('@/features/admin/pages/AdminUserDetailPage'), 'AdminUserDetailPage') },
  {
    path: 'usuarios/:id/editar',
    ...lazyPage(() => import('@/features/admin/pages/AdminUserFormPage'), 'AdminUserFormPage'),
  },
  { path: 'negocios', ...lazyPage(() => import('@/features/admin/pages/AdminBusinessesPage'), 'AdminBusinessesPage') },
  {
    path: 'negocios/:id',
    ...lazyPage(() => import('@/features/admin/pages/AdminBusinessDetailPage'), 'AdminBusinessDetailPage'),
  },
  { path: 'leads', ...lazyPage(() => import('@/features/admin/pages/AdminLeadsPage'), 'AdminLeadsPage') },
  { path: 'roles', ...lazyPage(() => import('@/features/admin/pages/AdminRolesPage'), 'AdminRolesPage') },
];

/**
 * Router declarativo con `createBrowserRouter`. Las rutas de cada panel
 * exigen su rol mediante `RequireRole`.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <MarketingLayout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { LandingPage } = await import('@/features/landing/pages/LandingPage');
              return { Component: LandingPage };
            },
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            lazy: async () => {
              const { LoginPage } = await import('@/features/auth/pages/LoginPage');
              return { Component: LoginPage };
            },
          },
          {
            path: '/register',
            lazy: async () => {
              const { RegisterPage } = await import('@/features/auth/pages/RegisterPage');
              return { Component: RegisterPage };
            },
          },
        ],
      },
      {
        element: <RequireRole roles={['business']} />,
        children: [
          {
            path: '/dashboard',
            element: <BusinessLayout />,
            children: businessRoutes,
          },
        ],
      },
      {
        element: <RequireRole roles={['client']} />,
        children: [
          {
            path: '/cuenta',
            element: <ClientLayout />,
            children: clientRoutes,
          },
        ],
      },
      {
        element: <RequireRole roles={['admin']} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: adminRoutes,
          },
        ],
      },
      {
        path: '*',
        lazy: async () => {
          const { NotFoundPage } = await import('@/shared/pages/NotFoundPage');
          return { Component: NotFoundPage };
        },
      },
    ],
  },
]);
