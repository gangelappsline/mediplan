import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { meRequest } from '@/features/auth/api';
import { homePathForUser, hasAnyRole } from '@/features/auth/roles';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { getSession, subscribeSession } from '@/shared/api/session';
import { Button } from '@/shared/components/ui/button';
import type { RoleName } from '@/types';

/**
 * Protege un grupo de rutas por rol. Sin sesión → `/login`. Con sesión pero
 * sin el rol requerido → redirige a la pantalla de inicio de su rol.
 * Refresca el usuario con `GET /me` en segundo plano.
 */
function RequireRole({ roles }: { roles: readonly RoleName[] }) {
  const session = useSyncExternalStore(subscribeSession, getSession, getSession);
  const location = useLocation();

  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: meRequest,
    enabled: Boolean(session),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasAnyRole(session.user, roles)) {
    const home = homePathForUser(session.user);
    if (home) return <Navigate to={home} replace />;
    return <NoAccess />;
  }

  return <Outlet />;
}

function NoAccess() {
  const logout = useLogout();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Tu cuenta no tiene acceso al panel</h1>
      <p className="text-sm text-muted-foreground">
        Tu usuario no tiene un rol asignado. Pide a un administrador de MediPlan que te asigne uno.
      </p>
      <Button type="button" variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
        <LogOut />
        Cerrar sesión
      </Button>
    </div>
  );
}

export { RequireRole };
