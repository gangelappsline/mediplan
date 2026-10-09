import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { queryClient } from '@/shared/lib/queryClient';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Providers de la aplicación: TanStack Query, tema claro/oscuro y el
 * contenedor de notificaciones de Sonner.
 */
function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export { AppProviders };
