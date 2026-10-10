import { Activity, ArrowRight, Bell, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSyncExternalStore } from 'react';

import { loadSession } from '@/features/auth/api';
import { WhatsAppMark } from '@/features/whatsapp/components/WhatsAppMark';
import { clinicDisplayName, clinicIdFromSession } from '@/features/whatsapp/clinic';
import { readPublicConnection, subscribeWhatsApp } from '@/features/whatsapp/storage';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

const upcomingModules = [
  {
    icon: CalendarDays,
    title: 'Agenda inteligente',
    description: 'Cuando esté lista, las citas usarán las plantillas de WhatsApp que configures ahora.',
  },
  {
    icon: Activity,
    title: 'Seguimiento de pacientes',
    description: 'Historial de visitas y el aviso de seguimiento post-consulta.',
  },
  {
    icon: Bell,
    title: 'Campañas',
    description: 'Promociones y descuentos salen por la cuenta de WhatsApp sincronizada.',
  },
] as const;

function DashboardPage() {
  const session = loadSession();
  const clinicId = clinicIdFromSession();
  const connection = useSyncExternalStore(
    subscribeWhatsApp,
    () => readPublicConnection(clinicId),
    () => null,
  );
  const displayName = session?.user.name ?? 'profesional';
  const clinicName = clinicDisplayName();

  return (
    <div>
      <Badge variant="outline">Panel de la clínica</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Hola, {displayName}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Desde aquí {clinicName} puede sincronizar WhatsApp con la API oficial de Meta y enviar avisos de citas,
        cierres, promociones y descuentos.
      </p>

      <Card className="mt-8 border-primary/30 bg-gradient-to-br from-primary/5 to-card">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-[#25D366] text-white">
            <WhatsAppMark className="size-6" />
          </div>
          <CardTitle>WhatsApp de la clínica</CardTitle>
          <CardDescription>
            {connection
              ? `${connection.verifiedName || 'Número sincronizado'} · ${connection.displayPhoneNumber || connection.phoneNumberId}`
              : 'Todavía no hay un número conectado. La sincronización se hace directo con Graph API, no con un simulador.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant={connection ? 'default' : 'secondary'}>
            {connection ? 'Sincronizado con Meta' : 'Sin sincronizar'}
          </Badge>
          <Button asChild>
            <Link to="/dashboard/whatsapp">
              {connection ? 'Administrar WhatsApp' : 'Sincronizar WhatsApp'}
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}

export { DashboardPage };
