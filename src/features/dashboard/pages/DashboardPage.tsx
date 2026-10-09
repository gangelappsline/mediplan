import { Activity, Bell, CalendarDays, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { clearSession, loadSession } from '@/features/auth/api';
import { Logo } from '@/shared/components/Logo';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

const upcomingModules = [
  {
    icon: CalendarDays,
    title: 'Agenda inteligente',
    description: 'Vista mensual, semanal y diaria con drag & drop y detección de conflictos.',
  },
  {
    icon: Activity,
    title: 'Seguimiento de pacientes',
    description: 'Historial de visitas, notas clínicas y recordatorios automáticos.',
  },
  {
    icon: Bell,
    title: 'Campañas de promociones',
    description: 'Envío masivo de descuentos por WhatsApp, email o SMS.',
  },
] as const;

/**
 * Ruta placeholder de `/dashboard`. La arquitectura ya está preparada para
 * los módulos de agenda, pacientes y campañas de la fase 2.
 */
function DashboardPage() {
  const navigate = useNavigate();
  const session = loadSession();
  const displayName = session?.user.name ?? 'profesional';

  function handleLogout() {
    clearSession();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="MediPlan — Ir al inicio">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {session.user.email}
              </Badge>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <Badge variant="outline" className="mb-4">
          Fase 2 · Próximamente
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Hola, {displayName}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tu cuenta está lista. El dashboard completo —agenda, pacientes y campañas— se
          implementará en la próxima fase; esta ruta placeholder confirma que la navegación y la
          autenticación ya funcionan de extremo a extremo.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {upcomingModules.map((module) => (
            <Card key={module.title} className="border-border/60">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <module.icon className="size-5" />
                </div>
                <CardTitle className="text-base">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">En desarrollo</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Button asChild variant="ghost">
            <Link to="/">← Volver al inicio</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

export { DashboardPage };
