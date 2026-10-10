import { useSyncExternalStore } from 'react';

import { getSession, subscribeSession } from '@/shared/api/session';
import type { User } from '@/types';

/** Usuario de la sesión actual, reactivo a login/logout. */
export function useCurrentUser(): User | null {
  const session = useSyncExternalStore(subscribeSession, getSession, getSession);
  return session?.user ?? null;
}
