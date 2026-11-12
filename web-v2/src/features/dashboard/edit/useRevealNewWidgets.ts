import { useEffect, useRef } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import { addedWidgetIds } from './newWidgets.utils';

/**
 * Scrolls the page to a widget of the grid (`DashboardGridView` marks each with `data-widget-id`). The grid renders a
 * new item a moment after the dashboard has it, so this waits a few frames for it. jsdom can't scroll.
 */
function scrollToWidget(id: WidgetId, framesLeft = 20): void {
  const element = document.querySelector(`[data-widget-id="${id}"]`);
  if (element) element.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  else if (framesLeft > 0) requestAnimationFrame(() => scrollToWidget(id, framesLeft - 1));
}

/**
 * In edit mode, brings a widget just added into view: a new widget takes the first free slot, usually under everything
 * else, so without this adding one looks like nothing happened. Whatever added it (the Add menu, a dialog, paste,
 * duplicate, ChartBuilder).
 */
export function useRevealNewWidgets(dashboard: Dashboard | undefined, editing: boolean, reveal: (id: WidgetId) => void = scrollToWidget): void {
  const seen = useRef<{ dashboardId: number; ids: WidgetId[] }>(undefined);
  useEffect(() => {
    if (!dashboard) return;
    const ids = dashboard.widgets.map(widget => widget.id);
    const previous = seen.current;
    seen.current = { dashboardId: dashboard.id, ids };
    if (!editing || previous?.dashboardId !== dashboard.id) return;
    const added = addedWidgetIds(previous.ids, ids);
    const last = added[added.length - 1];
    if (last !== undefined) reveal(last);
  }, [dashboard, editing, reveal]);
}
