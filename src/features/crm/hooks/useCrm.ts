import { useCallback, useSyncExternalStore } from 'react';

import { readCrmData, resetCrmData, subscribeCrm } from '@/features/crm/storage';
import type { CrmData } from '@/features/crm/types';
import { clinicIdFromSession } from '@/features/whatsapp/clinic';

const EMPTY_CRM: CrmData = {
  clients: [],
  activities: [],
  tasks: [],
  deals: [],
  appointments: [],
};

/**
 * Datos CRM reactivos de la clínica de la sesión actual. Se sincronizan con
 * `localStorage` mediante `useSyncExternalStore` (mismo patrón que WhatsApp).
 */
export function useCrm(): { clinicId: string; data: CrmData; reset: () => void } {
  const clinicId = clinicIdFromSession();

  const data = useSyncExternalStore(
    subscribeCrm,
    () => readCrmData(clinicId),
    () => EMPTY_CRM,
  );

  const reset = useCallback(() => {
    resetCrmData(clinicId);
  }, [clinicId]);

  return { clinicId, data, reset };
}
