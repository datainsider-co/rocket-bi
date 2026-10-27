import { Button, Result, Spin } from 'antd';
import { DashboardPermissionsProvider } from '../access/DashboardPermissionsContext';
import { PasswordGateView } from '../access/PasswordGateView';
import { DashboardEditProvider } from '../edit/DashboardEditContext';
import { SettingButtonView } from '../edit/settings/SettingButtonView';
import { ViewAsProvider } from '../view-as/ViewAsContext';
import { DashboardCanvas } from './DashboardCanvas';
import type { DashboardPageViewProps } from './DashboardPageView';

/** The page below its header: loading, the error, the password, or the dashboard with what the viewer may do on it. */
export function DashboardPageBody({ dashboard, load, state, layout, onBack }: DashboardPageViewProps) {
  const { access, viewAs, editing } = state;
  if (load.isLoading || (dashboard && access.lock === 'checking')) return <Spin className="flex! h-full items-center justify-center" />;
  if (load.error || !dashboard) {
    return (
      <Result
        status="warning"
        title={load.error ?? 'Load dashboard error!'}
        extra={
          <Button type="primary" onClick={load.onRetry}>
            Retry
          </Button>
        }
      />
    );
  }
  // Nothing is queried until the password is given.
  if (access.lock === 'locked') return <PasswordGateView onUnlock={access.onUnlock} onCancel={onBack} />;
  return (
    <DashboardPermissionsProvider permissions={access.permissions}>
      <ViewAsProvider user={viewAs.user}>
        <DashboardEditProvider
          editing={editing.mode.editing}
          onPositionsChange={editing.mode.move}
          permissions={access.permissions}
          handlers={editing.actions.widget}
          tabHandlers={editing.actions.tab}
        >
          <DashboardCanvas dashboard={dashboard} mobile={layout.mobile} corner={editing.mode.editing && <SettingButtonView items={editing.settingMenu} />} />
        </DashboardEditProvider>
      </ViewAsProvider>
    </DashboardPermissionsProvider>
  );
}
