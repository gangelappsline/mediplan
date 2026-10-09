import { Link } from 'react-router-dom';

import { Logo } from '@/shared/components/Logo';
import { Button } from '@/shared/components/ui/button';

/** Página 404 de rutas desconocidas. */
function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link to="/" aria-label="MediPlan — Ir al inicio">
        <Logo size="lg" />
      </Link>
      <p className="mt-10 text-7xl font-bold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        La página que buscas no existe o se movió. Vuelve al inicio para seguir gestionando tu
        clínica.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/">Volver al inicio</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </div>
    </div>
  );
}

export { NotFoundPage };
