import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import { ConnectPanel, useWhatsAppCapabilities } from '@/features/whatsapp/components/ConnectPanel';
import { ConnectedPanel } from '@/features/whatsapp/components/ConnectedPanel';
import { SetupGuide } from '@/features/whatsapp/components/SetupGuide';
import { WhatsAppMark } from '@/features/whatsapp/components/WhatsAppMark';
import { clinicDisplayName, clinicIdFromSession } from '@/features/whatsapp/clinic';
import { readPublicConnection, subscribeWhatsApp } from '@/features/whatsapp/storage';
import { Badge } from '@/shared/components/ui/badge';
import { useSyncExternalStore } from 'react';

function useClinic() {
  return {
    id: clinicIdFromSession(),
    name: clinicDisplayName(),
  };
}

function WhatsAppPage() {
  const clinic = useClinic();
  const capabilities = useWhatsAppCapabilities();
  const connection = useSyncExternalStore(
    subscribeWhatsApp,
    () => readPublicConnection(clinic.id),
    () => null,
  );
  const [reconnecting, setReconnecting] = useState(false);
  const showForm = !connection || reconnecting;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#25D366] text-white">
            <WhatsAppMark className="size-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sincronización de WhatsApp</h1>
              <Badge variant="outline">API oficial de Meta</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Conecta el número de {clinic.name} con WhatsApp Cloud API para enviar confirmaciones, recordatorios,
              avisos de cierre, seguimiento, promociones y descuentos.
            </p>
          </div>
        </div>
      </header>

      {capabilities.isLoading || !capabilities.data ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Comprobando el acceso a Graph API…
        </p>
      ) : showForm ? (
        <ConnectPanel
          clinicId={clinic.id}
          capabilities={capabilities.data}
          onConnected={() => setReconnecting(false)}
          onCancel={connection ? () => setReconnecting(false) : undefined}
        />
      ) : (
        <ConnectedPanel
          clinicId={clinic.id}
          clinicName={clinic.name}
          connection={connection}
          capabilities={capabilities.data}
          onReconnect={() => setReconnecting(true)}
          onDisconnected={() => setReconnecting(false)}
        />
      )}

      <SetupGuide showEmbedded={showForm} startOpen={showForm} />
    </div>
  );
}

export { WhatsAppPage };
