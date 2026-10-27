import { useMemo, useState, type ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { TabWidget as TabWidgetModel } from '@/core/dashboard/Widget';
import { useDashboardEdit } from '../../edit/DashboardEditContext';
import { tabHeaderStyleOf } from './tabWidget.utils';
import { TabWidgetView } from './TabWidgetView';

interface TabWidgetProps {
  widget: TabWidgetModel;
  dashboard: Dashboard;
  mobile: boolean;
  renderWidget: (id: WidgetId) => ReactNode;
}

/** A tab widget; in edit mode a gear after its tabs and dots on each tab open their menus (v1 `TabViewer`). */
export function TabWidget({ widget, dashboard, mobile, renderWidget }: TabWidgetProps) {
  const [active, setActive] = useState(0);
  const { editing, onPositionsChange, tabMenu, tabItemMenu } = useDashboardEdit();
  const header = useMemo(() => tabHeaderStyleOf(widget), [widget]);
  const menus = editing ? { widget: tabMenu(widget), tab: (index: number) => tabItemMenu(widget, index) } : undefined;
  return (
    <TabWidgetView
      widget={widget}
      dashboard={dashboard}
      mobile={mobile}
      renderWidget={renderWidget}
      edit={{ editable: editing, onPositionsChange, menus }}
      active={active}
      onActiveChange={setActive}
      header={header}
    />
  );
}
