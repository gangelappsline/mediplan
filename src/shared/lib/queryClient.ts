import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente único de TanStack Query para toda la aplicación.
 *
 * `staleTime` de 5 minutos por defecto: los datos de agenda y pacientes no
 * necesitan revalidarse en cada foco de ventana.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
