import { useDashboardAccess } from '../access/useDashboardAccess';
import { useAutoRefresh } from '../chart-data/useAutoRefresh';
import type { ChartBuilderBridge } from '../edit/chartBuilderBridge';
import { useDashboardEditing } from '../edit/useDashboardEditing';
import { useIsMobile } from '../grid/useIsMobile';
import { refreshIntervalOf } from '../mode/dashboardMode.utils';
import { useDashboardDisplay } from '../mode/useDashboardDisplay';
import { useRelationshipModal } from '../relationship/useRelationshipModal';
import { useDashboardShare } from '../share/useDashboardShare';
import { useViewAs } from '../view-as/useViewAs';
import { DashboardPageView } from './DashboardPageView';
import { useDashboardPage } from './useDashboardPage';

interface DashboardPageProps {
  embedded?: boolean;
  /** ChartBuilder's entry points, once it is ported (Phase 4). */
  chartBuilder?: ChartBuilderBridge;
}

export function DashboardPage({ embedded = false, chartBuilder }: DashboardPageProps) {
  const page = useDashboardPage(embedded);
  const mobile = useIsMobile();
  const access = useDashboardAccess(page.dashboard);
  const display = useDashboardDisplay();
  const viewAs = useViewAs();
  const editing = useDashboardEditing({ dashboard: page.dashboard, permissions: access.permissions, available: !mobile && !embedded, chartBuilder });
  const { dashboard } = page;
  const share = useDashboardShare(embedded ? undefined : dashboard);
  // Changes are allowed in edit mode only (v1).
  const relationship = useRelationshipModal(dashboard?.id ?? 0, editing.mode.editing);
  // No refresh while editing: the layout being moved would jump with each reload (v1 stopped it in ChartBuilder).
  const refreshing = access.lock === 'open' && !editing.mode.editing;
  useAutoRefresh(refreshing ? dashboard?.id : undefined, dashboard && refreshIntervalOf(dashboard.setting.autoRefreshSetting));
  return (
    <>
      <DashboardPageView
        dashboard={editing.mode.shown}
        headerFilters={page.headerFilters}
        load={{ isLoading: page.isLoading, error: page.error, onRetry: page.retry }}
        state={{ access, display, viewAs, editing }}
        layout={{ mobile, embedded }}
        options={embedded ? {} : { onRelationship: relationship.open, onShare: share.open }}
        onBack={page.goBack}
      />
      {share.modal}
      {relationship.modal}
    </>
  );
}

/** `/embedded/dashboard/:name` (v1 `EmbeddedDashboard.vue`): the dashboard without the app around it. */
export function EmbeddedDashboardPage() {
  return <DashboardPage embedded />;
}
