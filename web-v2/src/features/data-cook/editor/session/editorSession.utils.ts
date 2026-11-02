import type { EtlId } from '@/core/data-cook/EtlJob';

/**
 * One editing of an ETL, from opening the editor until it shows another ETL. A new ETL gets its id (and its URL) while
 * being edited; that is the same session, so the edits stay. `key` remounts the editor for a new session.
 */
export interface EditorSession {
  readonly key: number;
  /** The id in the URL. */
  readonly id: EtlId | undefined;
  /** What the session opened: an ETL to load, or `undefined` for a new one. */
  readonly startId: EtlId | undefined;
  /** The id the server gave the new ETL of this session. */
  readonly createdId: EtlId | undefined;
}

export function startSession(id: EtlId | undefined): EditorSession {
  return { key: 0, id, startId: id, createdId: undefined };
}

/** The session after the URL's id became `id`: the same one when that is the ETL it just created, a new one otherwise. */
export function nextSession(session: EditorSession, id: EtlId | undefined): EditorSession {
  if (id === session.id) return session;
  if (id !== undefined && id === session.createdId) return { ...session, id };
  return { key: session.key + 1, id, startId: id, createdId: undefined };
}

export function withCreated(session: EditorSession, id: EtlId): EditorSession {
  return { ...session, createdId: id };
}
