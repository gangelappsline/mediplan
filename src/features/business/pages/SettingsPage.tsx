import { BusinessProfileForm } from '@/features/business/components/BusinessProfileForm';
import { BusinessSettingsForm } from '@/features/business/components/BusinessSettingsForm';
import { useBusinessProfile, useBusinessSettings } from '@/features/business/hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

/** Configuración: perfil del negocio (`/business/profile`) y reglas de agenda (`/business/settings`). */
export function SettingsPage() {
  const profile = useBusinessProfile();
  const settings = useBusinessSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Configuración" description="Datos del negocio y reglas de tu agenda." />

      <Card>
        <CardHeader>
          <CardTitle>Perfil del negocio</CardTitle>
          <CardDescription>Información visible para tus clientes y en tus documentos.</CardDescription>
        </CardHeader>
        <CardContent>
          <QueryBoundary isLoading={profile.isLoading} error={profile.error} onRetry={() => void profile.refetch()}>
            {profile.data ? <BusinessProfileForm business={profile.data} /> : null}
          </QueryBoundary>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agenda y horario</CardTitle>
          <CardDescription>Duración de citas, anticipación permitida y horario de atención.</CardDescription>
        </CardHeader>
        <CardContent>
          <QueryBoundary isLoading={settings.isLoading} error={settings.error} onRetry={() => void settings.refetch()}>
            {settings.data ? <BusinessSettingsForm settings={settings.data} /> : null}
          </QueryBoundary>
        </CardContent>
      </Card>
    </div>
  );
}
