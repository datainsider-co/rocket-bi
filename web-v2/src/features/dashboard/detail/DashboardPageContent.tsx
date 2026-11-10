import { Suspense, useMemo, useState } from 'react';
import { useDashboardAccess } from '../access/useDashboardAccess';
import { useAutoRefresh } from '../chart-data/useAutoRefresh';
import type { ChartBuilderBridge, ChartBuilderHost, ChartBuilderRequest } from '../edit/chartBuilderBridge';
import { useDashboardEditing } from '../edit/useDashboardEditing';
import { useIsMobile } from '../grid/useIsMobile';
import { refreshIntervalOf } from '../mode/dashboardMode.utils';
import { useDashboardDisplay } from '../mode/useDashboardDisplay';
import { useRelationshipModal } from '../relationship/useRelationshipModal';
import { useDashboardShare } from '../share/useDashboardShare';
import { useViewAs } from '../view-as/useViewAs';
import { DashboardPageView } from './DashboardPageView';
import type { useDashboardPage } from './useDashboardPage';

interface DashboardPageContentProps {
  page: ReturnType<typeof useDashboardPage>;
  embedded: boolean;
  /** ChartBuilder, given by the route; without it edit mode has no Add chart nor Config chart. */
  chartBuilder?: ChartBuilderHost;
}

/** The loaded page: what the viewer may do on it, under the dashboard's theme so its messages and confirms take it. */
export function DashboardPageContent({ page, embedded, chartBuilder: ChartBuilder }: DashboardPageContentProps) {
  const [builderRequest, setBuilderRequest] = useState<ChartBuilderRequest>();
  const chartBuilder = useMemo<ChartBuilderBridge | undefined>(() => ChartBuilder && { open: setBuilderRequest }, [ChartBuilder]);
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
        builder={
          ChartBuilder &&
          builderRequest &&
          page.dashboard && (
            // The builder is its own chunk: nothing shows while it loads, as the menu that opened it closes.
            <Suspense fallback={null}>
              <ChartBuilder request={builderRequest} dashboard={page.dashboard} editor={editing.editor} onClose={() => setBuilderRequest(undefined)} />
            </Suspense>
          )
        }
        onBack={page.goBack}
      />
      {share.modal}
      {relationship.modal}
    </>
  );
}
