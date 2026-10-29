import type { Connection } from '@/core/connection/Connection';
import type { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';

/** Which setup modal is open. `config` and `progress` carry the connection being set up. */
export type SetupState =
  | { step: 'hidden' }
  | { step: 'select' }
  | { step: 'config'; connection: Connection }
  | { step: 'progress'; connection: Connection };

export const HIDDEN: SetupState = { step: 'hidden' };

export interface SetupStatus {
  /** `organization:manage:connection`; without it the user can't set anything up, so nothing shows. */
  isPermitted: boolean;
  exists: boolean;
  /** `undefined` when the saved connection is a type v2 can't edit yet. */
  connection?: Connection | undefined;
  history?: RefreshSchemaHistory | undefined;
}

/**
 * Where setup starts after login (v1 `ConnectionStore.isConfigStep` / `isSetUpStep`):
 * - no connection → pick a type;
 * - the organization's first schema refresh failed → fix the connection;
 * - the first refresh is still running → watch it.
 * Later refreshes failing don't reopen setup. A saved type v2 can't edit restarts from the type list.
 */
export function toInitialSetupState({ isPermitted, exists, connection, history }: SetupStatus): SetupState {
  if (!isPermitted) return HIDDEN;
  if (!exists) return { step: 'select' };
  if (!history?.isFirstRun) return HIDDEN;
  if (history.isError) return connection ? { step: 'config', connection } : { step: 'select' };
  if (history.isRunning && connection) return { step: 'progress', connection };
  return HIDDEN;
}

