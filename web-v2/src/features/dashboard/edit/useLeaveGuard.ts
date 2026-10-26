import { useEffect, useRef } from 'react';
import { App } from 'antd';
import { useBlocker } from 'react-router';
import { leavesDashboard } from './editMenus.utils';

/**
 * Asks before leaving the dashboard in edit mode (v1 `beforeRouteLeave` + `requireConfirmBack`), and before closing the
 * tab with an unsaved layout.
 */
export function useLeaveGuard(active: boolean, dirty: boolean, dashboardId: number | undefined) {
  const { modal } = App.useApp();
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
    modal.confirm({
      title: 'Leave edit mode?',
      content: 'Changes to the layout you have not saved will be lost.',
      okText: 'Leave',
      cancelText: 'Stay',
      onOk: () => settle(true),
      onCancel: () => settle(false)
    });
  }, [blocker, modal]);

  useEffect(() => {
    if (!active || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active, dirty]);
}
