import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Connection } from '@/core/connection/Connection';
import { createConnection } from '@/core/connection/Connection';
import type { ConnectionType } from '@/core/connection/ConnectionType';
import { connectionKeys } from '../connectionQueries';

/**
 * Which modal of the page is open. `config` from Edit closes on Cancel; from the type list (Change, setup) or the
 * progress modal it goes back to the list, like v1.
 */
export type ConfigDialog =
  | { kind: 'none' }
  | { kind: 'select' }
  | { kind: 'config'; connection: Connection; backTo: 'select' | 'close' }
  | { kind: 'progress'; connection: Connection };

const NONE: ConfigDialog = { kind: 'none' };

/** The setup modals on the DataSource page: pick a type, fill the form, watch the schema refresh. */
export function useConfigDialog() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<ConfigDialog>(NONE);

  const close = useCallback(() => setDialog(NONE), []);
  const finish = useCallback(() => {
    setDialog(NONE);
    void queryClient.invalidateQueries({ queryKey: connectionKeys.all });
  }, [queryClient]);

  return useMemo(
    () => ({
      dialog,
      change: () => setDialog({ kind: 'select' }),
      edit: (connection: Connection) => setDialog({ kind: 'config', connection, backTo: 'close' }),
      choose: (type: ConnectionType) =>
        setDialog({ kind: 'config', connection: createConnection(type), backTo: 'select' }),
      backToSelect: () => setDialog({ kind: 'select' }),
      saved: (connection: Connection) => setDialog({ kind: 'progress', connection }),
      backFromProgress: (connection: Connection) => setDialog({ kind: 'config', connection, backTo: 'select' }),
      close,
      finish
    }),
    [dialog, close, finish]
  );
}
