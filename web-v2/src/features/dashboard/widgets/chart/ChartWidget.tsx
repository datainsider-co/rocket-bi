import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { ChartWidget as ChartWidgetModel } from '@/core/dashboard/Widget';
import { useDashboardEdit } from '../../edit/DashboardEditContext';
import { getDashboardTheme } from '../../theme/dashboardThemes';
import { WidgetContainer } from '../WidgetContainer';
import { AppliedFiltersView } from './AppliedFiltersView';
import { ChartActionsView } from './ChartActionsView';
import { ChartWidgetView } from './ChartWidgetView';
import { InnerFilter } from './InnerFilter';
import { useChartWidget } from './useChartWidget';

interface ChartWidgetProps {
  widget: ChartWidgetModel;
  dashboard: Dashboard;
}

/** A chart on its card, with its action bar (v1 `ChartHolder`). */
export function ChartWidget({ widget, dashboard }: ChartWidgetProps) {
  const chart = useChartWidget(widget, dashboard.id);
  const { editing, widgetMenu } = useDashboardEdit();
  const actions = (
    <ChartActionsView
      innerFilter={
        widget.chartFilter && <InnerFilter filter={widget.chartFilter} dashboardId={dashboard.id} headerRequests={chart.innerFilterRequests} />
      }
      appliedFilters={chart.appliedFilters.filters.length > 0 && <AppliedFiltersView {...chart.appliedFilters} />}
      menuItems={editing ? widgetMenu(widget) : chart.widgetItems}
      editing={editing}
    />
  );
  return (
    <WidgetContainer widget={widget} defaults={dashboard.setting.widgetSetting} actions={actions}>
      <ChartWidgetView widget={widget} dashboardId={dashboard.id} themeColors={getDashboardTheme(dashboard.setting.themeName).colors} chart={chart} />
    </WidgetContainer>
  );
}
