import type { ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { Widget } from '@/core/dashboard/Widget';
import { useDashboardEdit } from '../edit/DashboardEditContext';
import { WidgetEditMenuView } from '../edit/WidgetEditMenuView';
import type { NestedGridEdit } from '../grid/DashboardGrid';
import { ChartWidget } from './chart/ChartWidget';
import { FilterPanel } from './filter-panel/FilterPanel';
import { ImageWidgetView } from './image/ImageWidgetView';
import { TabWidget } from './tab/TabWidget';
import { TextWidgetView } from './text/TextWidgetView';
import { WidgetContainer } from './WidgetContainer';

interface WidgetRendererProps {
  widget: Widget;
  dashboard: Dashboard;
  mobile: boolean;
  /** Renders a child of a tab or filter panel by id. */
  renderWidget: (id: WidgetId) => ReactNode;
}

function WidgetBody({ widget, dashboard, mobile, renderWidget, edit }: WidgetRendererProps & { edit: NestedGridEdit }) {
  switch (widget.kind) {
    case 'chart':
      // Charts draw their own card, which holds their action bar (`ChartWidget`).
      return null;
    case 'text':
      return <TextWidgetView widget={widget} />;
    case 'image':
      return <ImageWidgetView widget={widget} />;
    case 'filter_panel':
      return <FilterPanel widget={widget} dashboard={dashboard} mobile={mobile} renderWidget={renderWidget} edit={edit} />;
    case 'tab':
      // Rendered with its own card by `WidgetRenderer`.
      return null;
    case 'unsupported':
      return <div className="text-xs">Widget unsupported</div>;
  }
}

/** One widget on its card (v1 `WidgetHolder` / `ChartHolder` / `OtherWidget` / `TabViewer`), with its menu in edit mode. */
export function WidgetRenderer(props: WidgetRendererProps) {
  const { widget, dashboard } = props;
  const { editing, onPositionsChange, widgetMenu, tabMenu } = useDashboardEdit();
  if (widget.kind === 'chart') return <ChartWidget widget={widget} dashboard={dashboard} />;
  if (widget.kind === 'tab') return <TabWidget widget={widget} dashboard={dashboard} mobile={props.mobile} renderWidget={props.renderWidget} />;
  const menu = widget.kind === 'filter_panel' ? tabMenu(widget, 0) : widgetMenu(widget);
  return (
    <WidgetContainer widget={widget} defaults={dashboard.setting.widgetSetting} actions={editing && <WidgetEditMenuView items={menu} />}>
      <WidgetBody {...props} edit={{ editable: editing, onPositionsChange }} />
    </WidgetContainer>
  );
}
