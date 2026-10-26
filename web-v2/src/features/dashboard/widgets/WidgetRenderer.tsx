import type { ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { Widget } from '@/core/dashboard/Widget';
import { ChartWidget } from './chart/ChartWidget';
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
      // Charts draw their own card, which holds their action bar (`ChartWidget`).
      return null;
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
  if (widget.kind === 'chart') return <ChartWidget widget={widget} dashboard={dashboard} />;
  return (
    <WidgetContainer widget={widget} defaults={dashboard.setting.widgetSetting}>
      <WidgetBody {...props} />
    </WidgetContainer>
  );
}
