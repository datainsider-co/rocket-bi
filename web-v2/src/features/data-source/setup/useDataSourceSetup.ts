import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Connection } from '@/core/connection/Connection';
import { createConnection } from '@/core/connection/Connection';
import type { ConnectionType } from '@/core/connection/ConnectionType';
import { connectionKeys } from '../connectionQueries';
import { HIDDEN } from './setup.utils';
import type { SetupState } from './setup.utils';

/**
 * The setup wizard. It starts where `useSetupStatus` says; once the user acts, their step wins over the server
 * status, so a refetch in the background never jumps between modals.
 */
export function useDataSourceSetup(initial: SetupState | undefined) {
  const queryClient = useQueryClient();
  const [chosen, setChosen] = useState<SetupState | null>(null);

  return {
    state: chosen ?? initial ?? HIDDEN,
    choose: (type: ConnectionType) => setChosen({ step: 'config', connection: createConnection(type) }),
    backToSelect: () => setChosen({ step: 'select' }),
    saved: (connection: Connection) => setChosen({ step: 'progress', connection }),
    edit: (connection: Connection) => setChosen({ step: 'config', connection }),
    skip: () => setChosen(HIDDEN),
    finish: () => {
      setChosen(HIDDEN);
      void queryClient.invalidateQueries({ queryKey: connectionKeys.all });
    }
  };
}
