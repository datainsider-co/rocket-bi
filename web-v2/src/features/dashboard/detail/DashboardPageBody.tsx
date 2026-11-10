import { DashboardSetting } from '@/core/dashboard/DashboardSetting';
import { ErrorState } from '@/shared/status/ErrorState';
import { Loading } from '@/shared/status/Loading';
import { DashboardPermissionsProvider } from '../access/DashboardPermissionsContext';
import { PasswordGateView } from '../access/PasswordGateView';
import { DashboardEditProvider } from '../edit/DashboardEditContext';
import { SettingButtonView } from '../edit/settings/SettingButtonView';
import { ViewAsProvider } from '../view-as/ViewAsContext';
import { DashboardCanvas } from './DashboardCanvas';
import { dashboardCssVars } from './dashboardDetail.utils';
import type { DashboardPageViewProps } from './DashboardPageView';

/** The content box before there is a dashboard: v1's default setting, as wide as the page. */
const DEFAULT_VARS = dashboardCssVars(new DashboardSetting());

/** The page below its header: loading, the error, the password, or the dashboard with what the viewer may do on it. */
export function DashboardPageBody({ dashboard, load, state, layout, onBack }: DashboardPageViewProps) {
  const { access, viewAs, editing } = state;
  // v1 drew both inside the content box.
  if (load.isLoading || (dashboard && access.lock === 'checking')) {
    return (
      <div className="dashboard-content" style={DEFAULT_VARS}>
        <div className="dashboard-content__status">
          <Loading />
        </div>
      </div>
    );
  }
  if (load.error || !dashboard) {
    return (
      <div className="dashboard-content" style={DEFAULT_VARS}>
        <div className="dashboard-content__status">
          <ErrorState message={load.error ?? 'Load dashboard error!'} onRetry={load.onRetry} />
        </div>
      </div>
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
          <DashboardCanvas
            dashboard={dashboard}
            mobile={layout.mobile}
            corner={editing.mode.editing && <SettingButtonView items={editing.settingMenu} />}
            onAddChart={editing.mode.editing ? editing.actions.add.addChart : undefined}
          />
        </DashboardEditProvider>
      </ViewAsProvider>
    </DashboardPermissionsProvider>
  );
}
