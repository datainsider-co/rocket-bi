import type { ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { Widget } from '@/core/dashboard/Widget';
import { useDashboardEdit } from '../edit/DashboardEditContext';
import type { NestedGridEdit } from '../grid/DashboardGrid';
import { ChartWidget } from './chart/ChartWidget';
import { FilterPanel } from './filter-panel/FilterPanel';
import { ImageWidgetView } from './image/ImageWidgetView';
import { WidgetMenuView } from './menu/WidgetMenuView';
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

function WidgetBody({ widget }: { widget: Widget }) {
  switch (widget.kind) {
    case 'text':
      return <TextWidgetView widget={widget} />;
    case 'image':
      return <ImageWidgetView widget={widget} />;
    case 'chart':
    case 'filter_panel':
    case 'tab':
      // Rendered by `WidgetRenderer`: charts draw their own card with their action bar, tabs and panels have none.
      return null;
    case 'unsupported':
      return <div className="text-xs">Widget unsupported</div>;
  }
}

/**
 * One widget (v1 `WidgetHolder` / `ChartHolder` / `OtherWidget` / `TabViewer` / `FilterPanelViewer`), with v1's gear
 * menu in edit mode. Tab widgets and filter panels sit on the grid without a card, as in v1.
 */
export function WidgetRenderer({ widget, dashboard, mobile, renderWidget }: WidgetRendererProps) {
  const { editing, onPositionsChange, widgetMenu, tabMenu } = useDashboardEdit();
  switch (widget.kind) {
    case 'chart':
      return <ChartWidget widget={widget} dashboard={dashboard} />;
    case 'tab':
      return <TabWidget widget={widget} dashboard={dashboard} mobile={mobile} renderWidget={renderWidget} />;
    case 'filter_panel': {
      const edit: NestedGridEdit = { editable: editing, onPositionsChange };
      const actions = editing && <WidgetMenuView items={tabMenu(widget)} label="Widget actions" trigger="setting" />;
      return <FilterPanel widget={widget} dashboard={dashboard} mobile={mobile} renderWidget={renderWidget} edit={edit} actions={actions} />;
    }
    default:
      return (
        <WidgetContainer
          widget={widget}
          defaults={dashboard.setting.widgetSetting}
          actions={editing && <WidgetMenuView items={widgetMenu(widget)} label="Widget actions" trigger="setting" />}
        >
          <WidgetBody widget={widget} />
        </WidgetContainer>
      );
  }
}
