import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';
import { useConfirm } from '../dialogs/ConfirmContext';
import { leavesDashboard } from './editMenus.utils';

/**
 * Asks before leaving the dashboard in edit mode (v1 `beforeRouteLeave` + `requireConfirmBack`), and before closing the
 * tab with an unsaved layout.
 */
export function useLeaveGuard(active: boolean, dirty: boolean, dashboardId: number | undefined) {
  const confirm = useConfirm();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && dashboardId !== undefined && currentLocation.pathname !== nextLocation.pathname && leavesDashboard(nextLocation.pathname, dashboardId)
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
    confirm({
      title: 'Leave edit mode?',
      message: 'Changes to the layout you have not saved will be lost.',
      okText: 'Leave',
      cancelText: 'Stay',
      onOk: () => settle(true),
      onCancel: () => settle(false)
    });
  }, [blocker, confirm]);

  useEffect(() => {
    if (!active || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active, dirty]);
}
