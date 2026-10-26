import { createContext, use, useMemo, type ReactNode } from 'react';
import type { SuggestedUser } from '@/core/user/UserService';

interface ViewAsState {
  /** The user the dashboard is queried as (v1 `ChartDataStore.viewAsUser`); the viewer themselves when absent. */
  user?: SuggestedUser;
}

const ViewAsContext = createContext<ViewAsState | null>(null);

export function ViewAsProvider({ user, children }: { user?: SuggestedUser; children: ReactNode }) {
  const value = useMemo(() => ({ user }), [user]);
  return <ViewAsContext value={value}>{children}</ViewAsContext>;
}

export function useViewAsUser(): SuggestedUser | undefined {
  const state = use(ViewAsContext);
  if (!state) {
    throw new Error('useViewAsUser must be used inside <ViewAsProvider>');
  }
  return state.user;
}
