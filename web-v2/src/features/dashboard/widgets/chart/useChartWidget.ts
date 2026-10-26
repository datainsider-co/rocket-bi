import { useCallback, useMemo, useState } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { DEFAULT_PAGE_SIZE, isPagedSetting, type Paging } from '@/core/query/QueryRequest';
import { vizFromSetting } from '@/core/query/vizOptions';
import { useWidgetData } from '../../chart-data/useWidgetData';
import { selectionOf, selectionToControl } from '../../charts/filter/filter.utils';
import { buildChartQuery } from '../../controls/chartQuery.utils';
import type { ControlEntry } from '../../controls/controls.utils';
import { useDashboardControls } from '../../controls/DashboardControlsContext';

const FIRST_PAGE: Paging = { from: 0, size: DEFAULT_PAGE_SIZE };

/** A clicked series point waiting for the viewer to pick an action. */
export interface PointMenu {
  value: string;
  position: { x: number; y: number };
}

/**
 * One chart widget (v1 `ChartHolder`): its query with the controls it depends on, its page, and its own selection as
 * a control for others (filter values, pie slices, a series point used as a filter).
 */
export function useChartWidget(widget: ChartWidget, dashboardId: number) {
  const { controls, widgets, entryOf, setControl } = useDashboardControls();
  const [paging, setPaging] = useState<Paging>(FIRST_PAGE);
  const [pointMenu, setPointMenu] = useState<PointMenu | null>(null);

  const viz = useMemo(() => vizFromSetting(widget.setting), [widget.setting]);
  const query = useMemo(() => buildChartQuery(widget, controls, widgets), [widget, controls, widgets]);
  const data = useWidgetData(widget, { dashboardId, query, paging: isPagedSetting(widget.setting) ? paging : undefined });

  const entry = entryOf(widget.id);
  const selected = useMemo(() => selectionOf(entry), [entry]);
  const setEntry = useCallback((values: ControlEntry) => setControl(widget.id, values), [setControl, widget.id]);
  const onSelect = useCallback((values: string[]) => setEntry(selectionToControl(values)), [setEntry]);
  const onPointClick = useCallback((value: string, position: PointMenu['position']) => setPointMenu({ value, position }), []);

  const pointActions = {
    menu: pointMenu,
    canReset: selected.length > 0,
    // v1 "Use as a filter" and "Reset filter".
    useAsFilter: () => {
      if (pointMenu) onSelect([pointMenu.value]);
      setPointMenu(null);
    },
    reset: () => {
      onSelect([]);
      setPointMenu(null);
    },
    close: () => setPointMenu(null)
  };

  return {
    viz,
    query,
    data,
    entry,
    setEntry,
    table: { paging, loading: data.isFetching, onPageChange: setPaging },
    crossFilter: { selected, onSelect, onPointClick },
    pointActions
  };
}
