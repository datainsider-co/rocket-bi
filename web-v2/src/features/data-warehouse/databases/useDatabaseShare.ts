import { useCallback, useState } from 'react';
import type { DatabaseEntry } from '@/core/schema/DatabaseService';
import { databaseShare, type ShareRequest } from '@/features/share/share.utils';

export interface DatabaseShareDialog {
  /** What the open dialog shares; `undefined` while closed. */
  readonly request: ShareRequest | undefined;
  readonly open: (entry: DatabaseEntry) => void;
  readonly close: () => void;
}

/** A row's Share (v1 `DiShareModal.showShareDatabase`): the share dialog on that database, with people only. */
export function useDatabaseShare(): DatabaseShareDialog {
  const [request, setRequest] = useState<ShareRequest>();
  const open = useCallback((entry: DatabaseEntry) => setRequest(databaseShare(entry)), []);
  const close = useCallback(() => setRequest(undefined), []);
  return { request, open, close };
}
