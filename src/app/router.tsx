import { createBrowserRouter } from 'react-router-dom';

import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { MarketingLayout } from '@/shared/components/layout/MarketingLayout';
import { RootLayout } from '@/shared/components/layout/RootLayout';

/**
 * Router declarativo con `createBrowserRouter` y lazy loading por ruta:
 * cada página se descarga solo cuando se necesita.
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
        path: '/dashboard',
        lazy: async () => {
          const { DashboardLayout } = await import('@/features/dashboard/pages/DashboardLayout');
          return { Component: DashboardLayout };
        },
        children: [
          {
            index: true,
            lazy: async () => {
              const { DashboardPage } = await import('@/features/dashboard/pages/DashboardPage');
              return { Component: DashboardPage };
            },
          },
          {
            path: 'whatsapp',
            lazy: async () => {
              const { WhatsAppPage } = await import('@/features/whatsapp/pages/WhatsAppPage');
              return { Component: WhatsAppPage };
            },
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
