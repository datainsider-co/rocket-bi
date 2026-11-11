import type { ChartBuilderHost } from '../edit/chartBuilderBridge';
import { ConfirmProvider } from '../dialogs/ConfirmContext';
import { DashboardThemeProvider } from '../theme/DashboardThemeProvider';
import { getDashboardTheme } from '../theme/dashboardThemes';
import { useBodyDashboardTheme } from '../theme/useBodyDashboardTheme';
import { DashboardPageContent } from './DashboardPageContent';
import { useDashboardPage } from './useDashboardPage';

interface DashboardPageProps {
  embedded?: boolean;
  /** ChartBuilder, given by the route; without it edit mode has no Add chart nor Config chart. */
  chartBuilder?: ChartBuilderHost;
}

export function DashboardPage({ embedded = false, chartBuilder }: DashboardPageProps) {
  const page = useDashboardPage(embedded);
  useBodyDashboardTheme(getDashboardTheme(page.dashboard?.setting.themeName ?? '').cssName);
  return (
    <DashboardThemeProvider themeName={page.dashboard?.setting.themeName}>
      <ConfirmProvider>
        <DashboardPageContent page={page} embedded={embedded} chartBuilder={chartBuilder} />
      </ConfirmProvider>
    </DashboardThemeProvider>
  );
}

/** `/embedded/dashboard/:name` (v1 `EmbeddedDashboard.vue`): the dashboard without the app around it. */
export function EmbeddedDashboardPage() {
  return <DashboardPage embedded />;
}
