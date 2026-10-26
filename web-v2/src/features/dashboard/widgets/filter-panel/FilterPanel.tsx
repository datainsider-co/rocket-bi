import { useMemo, type ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { TabWidget } from '@/core/dashboard/Widget';
import { useDashboardControls } from '../../controls/DashboardControlsContext';
import { tabPositions } from '../../detail/dashboardDetail.utils';
import { filterPanelLook } from './filterPanel.utils';
import { FilterPanelView } from './FilterPanelView';

interface FilterPanelProps {
  widget: TabWidget;
  dashboard: Dashboard;
  mobile: boolean;
  renderWidget: (id: WidgetId) => ReactNode;
}

/** A filter panel (v1 `GroupFilter`): only its first tab is ever shown, as in v1. */
export function FilterPanel({ widget, dashboard, mobile, renderWidget }: FilterPanelProps) {
  const { applyPanel } = useDashboardControls();
  const tab = widget.tabItems[0];
  const positions = useMemo(() => (tab ? tabPositions(dashboard, tab) : {}), [dashboard, tab]);
  const look = useMemo(() => filterPanelLook(widget.json), [widget.json]);
  return (
    <FilterPanelView
      title={tab?.name ?? ''}
      look={look}
      positions={positions}
      grid={{ overlap: dashboard.setting.enableOverlap, mobile }}
      renderWidget={renderWidget}
      onApply={() => applyPanel(widget.id)}
    />
  );
}
