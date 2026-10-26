import type { ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { Widget } from '@/core/dashboard/Widget';
import { getDashboardTheme } from '../theme/dashboardThemes';
import { ChartWidgetView } from './chart/ChartWidgetView';
import { InnerFilter } from './chart/InnerFilter';
import { FilterPanel } from './filter-panel/FilterPanel';
import { ImageWidgetView } from './image/ImageWidgetView';
import { TabWidgetView } from './tab/TabWidgetView';
import { TextWidgetView } from './text/TextWidgetView';
import { WidgetContainer } from './WidgetContainer';

interface WidgetRendererProps {
  widget: Widget;
  dashboard: Dashboard;
  mobile: boolean;
  /** Renders a child of a tab or filter panel by id. */
  renderWidget: (id: WidgetId) => ReactNode;
}

function WidgetBody({ widget, dashboard, mobile, renderWidget }: WidgetRendererProps) {
  switch (widget.kind) {
    case 'chart':
      return (
        <ChartWidgetView widget={widget} dashboardId={dashboard.id} themeColors={getDashboardTheme(dashboard.setting.themeName).colors} />
      );
    case 'text':
      return <TextWidgetView widget={widget} />;
    case 'image':
      return <ImageWidgetView widget={widget} />;
    case 'filter_panel':
      return <FilterPanel widget={widget} dashboard={dashboard} mobile={mobile} renderWidget={renderWidget} />;
    case 'tab':
      return <TabWidgetView widget={widget} dashboard={dashboard} mobile={mobile} renderWidget={renderWidget} />;
    case 'unsupported':
      return <div className="text-xs">Widget unsupported</div>;
  }
}

/** One widget on its card (v1 `WidgetHolder` / `ChartHolder` / `OtherWidget` / `TabViewer`). */
export function WidgetRenderer(props: WidgetRendererProps) {
  const { widget, dashboard } = props;
  const innerFilter = widget.kind === 'chart' ? widget.chartFilter : undefined;
  const actions = innerFilter && (
    <div className="p-2">
      <InnerFilter filter={innerFilter} dashboardId={dashboard.id} />
    </div>
  );
  return (
    <WidgetContainer widget={widget} defaults={dashboard.setting.widgetSetting} actions={actions}>
      <WidgetBody {...props} />
    </WidgetContainer>
  );
}
