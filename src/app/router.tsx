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
        // Ruta placeholder: el dashboard se implementa en la fase 2.
        path: '/dashboard',
        lazy: async () => {
          const { DashboardPage } = await import('@/features/dashboard/pages/DashboardPage');
          return { Component: DashboardPage };
        },
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
