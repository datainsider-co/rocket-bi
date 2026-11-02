import { describe, expect, it } from 'vitest';
import { nextSession, startSession, withCreated } from './editorSession.utils';

describe('startSession', () => {
  it('opens an ETL, or a new one', () => {
    expect(startSession(4)).toEqual({ key: 0, id: 4, startId: 4, createdId: undefined });
    expect(startSession(undefined).startId).toBeUndefined();
  });
});

describe('nextSession', () => {
  it('keeps the session while the id stays', () => {
    const session = startSession(4);
    expect(nextSession(session, 4)).toBe(session);
  });

  it('keeps a new ETL’s session when the URL takes its id', () => {
    const created = withCreated(startSession(undefined), 12);

    expect(nextSession(created, 12)).toEqual({ key: 0, id: 12, startId: undefined, createdId: 12 });
  });

  it('starts over on another ETL, or on New ETL again', () => {
    const created = nextSession(withCreated(startSession(undefined), 12), 12);

    expect(nextSession(created, 7)).toEqual({ key: 1, id: 7, startId: 7, createdId: undefined });
    expect(nextSession(created, undefined)).toEqual({ key: 1, id: undefined, startId: undefined, createdId: undefined });
  });
});
