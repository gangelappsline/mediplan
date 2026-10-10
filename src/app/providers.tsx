import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { queryClient } from '@/shared/lib/queryClient';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Providers de la aplicación: TanStack Query, tema claro/oscuro, tooltips y el
 * contenedor de notificaciones de Sonner.
 *
 * `MotionConfig reducedMotion="user"` hace que Motion desactive por sí solo los
 * desplazamientos y escalados cuando el sistema pide menos animaciones.
 */
function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export { AppProviders };
