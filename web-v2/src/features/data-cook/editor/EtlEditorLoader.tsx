import { useState } from 'react';
import { newEtlJob, type EtlId } from '@/core/data-cook/EtlJob';
import { NEW_ETL_NAME } from './draft/etlDraft.utils';
import { EtlEditor } from './EtlEditor';
import { SavedEtlEditor } from './SavedEtlEditor';

interface EtlEditorLoaderProps {
  /** The ETL to open; `undefined` for a new one. */
  startId: EtlId | undefined;
  onCreated: (id: EtlId) => void;
}

/** The ETL the session opened, or a new one: empty, "Untitled ETL" (v1), created on the server with its first source. */
export function EtlEditorLoader({ startId, onCreated }: EtlEditorLoaderProps) {
  const [initial] = useState(() => newEtlJob(NEW_ETL_NAME));
  return startId === undefined ? <EtlEditor initial={initial} onCreated={onCreated} /> : <SavedEtlEditor id={startId} onCreated={onCreated} />;
}
