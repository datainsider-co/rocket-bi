import { useDashboardAccess } from '../access/useDashboardAccess';
import { useAutoRefresh } from '../chart-data/useAutoRefresh';
import { useIsMobile } from '../grid/useIsMobile';
import { refreshIntervalOf } from '../mode/dashboardMode.utils';
import { useDashboardDisplay } from '../mode/useDashboardDisplay';
import { useViewAs } from '../view-as/useViewAs';
import { DashboardPageView } from './DashboardPageView';
import { useDashboardPage } from './useDashboardPage';

export function DashboardPage({ embedded = false }: { embedded?: boolean }) {
  const page = useDashboardPage(embedded);
  const mobile = useIsMobile();
  const access = useDashboardAccess(page.dashboard);
  const display = useDashboardDisplay();
  const viewAs = useViewAs();
  const { dashboard } = page;
  useAutoRefresh(access.lock === 'open' ? dashboard?.id : undefined, dashboard && refreshIntervalOf(dashboard.setting.autoRefreshSetting));
  return (
    <DashboardPageView
      dashboard={dashboard}
      headerFilters={page.headerFilters}
      load={{ isLoading: page.isLoading, error: page.error, onRetry: page.retry }}
      access={access}
      display={display}
      viewAs={viewAs}
      layout={{ mobile, embedded }}
      onBack={page.goBack}
    />
  );
}

/** `/embedded/dashboard/:name` (v1 `EmbeddedDashboard.vue`): the dashboard without the app around it. */
export function EmbeddedDashboardPage() {
  return <DashboardPage embedded />;
}
