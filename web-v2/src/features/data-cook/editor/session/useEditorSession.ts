import { useCallback, useState } from 'react';
import type { EtlId } from '@/core/data-cook/EtlJob';
import { nextSession, startSession, withCreated, type EditorSession } from './editorSession.utils';

/** The editing session of the URL's ETL (`editorSession.utils`). Call `onCreated` before moving to the new ETL's URL. */
export function useEditorSession(id: EtlId | undefined): EditorSession & { onCreated: (id: EtlId) => void } {
  const [session, setSession] = useState(() => startSession(id));
  // Derived from the URL during render, so the editor never draws a session that is over.
  const next = nextSession(session, id);
  if (next !== session) setSession(next);
  const onCreated = useCallback((created: EtlId) => setSession(current => withCreated(current, created)), []);
  return { ...next, onCreated };
}
