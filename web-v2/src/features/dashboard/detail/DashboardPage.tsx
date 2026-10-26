import { useDashboardAccess } from '../access/useDashboardAccess';
import { useAutoRefresh } from '../chart-data/useAutoRefresh';
import { useIsMobile } from '../grid/useIsMobile';
import { refreshIntervalOf } from '../mode/dashboardMode.utils';
import { useDashboardDisplay } from '../mode/useDashboardDisplay';
import { DashboardPageView } from './DashboardPageView';
import { useDashboardPage } from './useDashboardPage';

export function DashboardPage() {
  const page = useDashboardPage();
  const mobile = useIsMobile();
  const access = useDashboardAccess(page.dashboard);
  const display = useDashboardDisplay();
  const { dashboard } = page;
  useAutoRefresh(access.lock === 'open' ? dashboard?.id : undefined, dashboard && refreshIntervalOf(dashboard.setting.autoRefreshSetting));
  return (
    <DashboardPageView
      dashboard={dashboard}
      headerFilters={page.headerFilters}
      load={{ isLoading: page.isLoading, error: page.error, onRetry: page.retry }}
      access={access}
      display={display}
      mobile={mobile}
      onBack={page.goBack}
    />
  );
}
