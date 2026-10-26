import { useIsMobile } from '../grid/useIsMobile';
import { DashboardPageView } from './DashboardPageView';
import { useDashboardPage } from './useDashboardPage';

export function DashboardPage() {
  const page = useDashboardPage();
  const mobile = useIsMobile();
  return (
    <DashboardPageView
      dashboard={page.dashboard}
      headerFilters={page.headerFilters}
      isLoading={page.isLoading}
      error={page.error}
      mobile={mobile}
      onRetry={page.retry}
      onBack={page.goBack}
    />
  );
}
