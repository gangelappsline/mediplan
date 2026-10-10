import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Store } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { businessProfileQuery } from '@/features/business/hooks';
import { PanelShell } from '@/features/panel/PanelShell';
import { businessFooterItem, adminNav, clientNav, businessNav } from '@/features/panel/navigation';
import { ApiError } from '@/shared/api/http';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState, LoadingState } from '@/shared/components/QueryState';

/** Puerta del panel de negocio: exige que el usuario tenga un negocio asociado. */
function BusinessGate() {
  const profile = useQuery(businessProfileQuery());

  if (profile.isLoading) return <LoadingState />;

  if (profile.error instanceof ApiError && profile.error.status === 404) {
    return (
      <EmptyState
        icon={Store}
        title="Tu cuenta todavía no tiene un negocio asociado"
        description="Contacta al equipo de MediPlan para que active tu negocio. Mientras tanto no podrás usar la agenda ni el CRM."
      />
    );
  }

  if (profile.error) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }

  return (
    <>
      {profile.data?.status.name === 'pending' ? (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          Tu negocio está en revisión ({profile.data.status.label}). Algunas funciones pueden limitarse.
        </div>
      ) : null}
      {profile.data?.status.name === 'suspended' ? (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-600" />
          Tu negocio está suspendido ({profile.data.status.label}). Contacta a MediPlan.
        </div>
      ) : null}
      <Outlet />
    </>
  );
}

function BusinessLayout() {
  return (
    <PanelShell groups={businessNav} footerItem={businessFooterItem} roleLabel="Negocio">
      <BusinessGate />
    </PanelShell>
  );
}

function ClientLayout() {
  return (
    <PanelShell groups={clientNav} roleLabel="Cliente" headerTitle="Mi cuenta">
      <Outlet />
    </PanelShell>
  );
}

function AdminLayout() {
  return (
    <PanelShell groups={adminNav} roleLabel="Administrador" headerTitle="Administración de MediPlan">
      <Outlet />
    </PanelShell>
  );
}

export { AdminLayout, BusinessLayout, ClientLayout };
