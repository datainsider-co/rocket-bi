import { useCallback, useEffect, useRef } from 'react';
import { App } from 'antd';
import { useBlocker } from 'react-router';
import { leavesPage, type PageLocation } from './leavesPage';

/** v1's words when leaving an edit of the Schema page (`DataSchema.ensureViewMode`). */
export const LEAVE_TITLE = 'It looks like you have been editing something';
export const LEAVE_CONTENT = 'If you leave before saving, your changes will be lost.';

/** What the confirm says. */
export interface LeaveTexts {
  readonly title: string;
  readonly content: string;
}

const SCHEMA_LEAVE: LeaveTexts = { title: LEAVE_TITLE, content: LEAVE_CONTENT };

/** Never: every page change asks. */
const NOWHERE = () => false;

/**
 * Asks before any navigation while `dirty` (v1 `beforeRouteLeave`), the URL's query too (the Schema page selects a
 * table with it), and before closing the tab. `release` lets the next navigation through: a save that moves on to what
 * it saved. `stays` names the locations that keep the edit on screen (the same item under a new URL), which don't ask.
 * One mounted at a time: React Router keeps a single blocker.
 */
export function useUnsavedGuard(
  dirty: boolean,
  texts: LeaveTexts = SCHEMA_LEAVE,
  stays: (next: PageLocation) => boolean = NOWHERE
): () => void {
  const { modal } = App.useApp();
  const released = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && !released.current && leavesPage(currentLocation, nextLocation) && !stays(nextLocation)
  );

  // The blocker is a new object on each render; ask once per blocked navigation.
  const asking = useRef(false);
  useEffect(() => {
    if (blocker.state !== 'blocked' || asking.current) return;
    asking.current = true;
    const settle = (leave: boolean) => {
      asking.current = false;
      if (leave) blocker.proceed();
      else blocker.reset();
    };
    modal.confirm({
      title: texts.title,
      content: texts.content,
      okText: 'Leave',
      cancelText: 'Stay',
      onOk: () => settle(true),
      onCancel: () => settle(false)
    });
  }, [blocker, modal, texts]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return useCallback(() => {
    released.current = true;
  }, []);
}
