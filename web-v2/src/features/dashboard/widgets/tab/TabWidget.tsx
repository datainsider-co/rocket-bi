import { useMemo, useState, type ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { TabWidget as TabWidgetModel } from '@/core/dashboard/Widget';
import { useDashboardEdit } from '../../edit/DashboardEditContext';
import { WidgetEditMenuView } from '../../edit/WidgetEditMenuView';
import { WidgetContainer } from '../WidgetContainer';
import { tabHeaderStyleOf } from './tabWidget.utils';
import { TabWidgetView } from './TabWidgetView';

interface TabWidgetProps {
  widget: TabWidgetModel;
  dashboard: Dashboard;
  mobile: boolean;
  renderWidget: (id: WidgetId) => ReactNode;
}

/** A tab widget on its card; in edit mode its menu acts on the open tab (v1 `TabViewer`). */
export function TabWidget({ widget, dashboard, mobile, renderWidget }: TabWidgetProps) {
  const [active, setActive] = useState(0);
  const { editing, onPositionsChange, tabMenu } = useDashboardEdit();
  const header = useMemo(() => tabHeaderStyleOf(widget), [widget]);
  return (
    <WidgetContainer widget={widget} defaults={dashboard.setting.widgetSetting} actions={editing && <WidgetEditMenuView items={tabMenu(widget, active)} />}>
      <TabWidgetView
        widget={widget}
        dashboard={dashboard}
        mobile={mobile}
        renderWidget={renderWidget}
        edit={{ editable: editing, onPositionsChange }}
        active={active}
        onActiveChange={setActive}
        header={header}
      />
    </WidgetContainer>
  );
}
