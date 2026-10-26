import { useCallback, useMemo, useReducer } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { drillColumnOf, drillFunction } from '@/core/query/drilldown';
import type { TableSort } from '@/core/query/tableSort';
import { chartViewReducer, INITIAL_VIEW, viewedSetting, type DrillField } from './chartView.utils';

/** The viewer's drill down, date function and sort of one chart (v1 kept them in stores, lost on reload too). */
export function useChartView(widget: ChartWidget) {
  const [view, dispatch] = useReducer(chartViewReducer, INITIAL_VIEW);
  const setting = useMemo(() => viewedSetting(widget.setting, view), [widget.setting, view]);

  const drillDown = useCallback(
    (value: string, field: DrillField, dateLevel?: string) =>
      dispatch({ type: 'drill', stored: widget.setting, step: { value, name: field.label, to: drillFunction(field.field, dateLevel) } }),
    [widget.setting]
  );

  return {
    view,
    /** The widget as the viewer sees it: its setting drilled, zoomed and sorted. */
    viewed: useMemo<ChartWidget>(() => ({ ...widget, setting }), [widget, setting]),
    drillColumn: useMemo(() => drillColumnOf(setting), [setting]),
    drillDown,
    back: useCallback((index: number) => dispatch({ type: 'back', index }), []),
    zoom: useCallback((level: string) => dispatch({ type: 'zoom', level }), []),
    sort: useCallback((sort: TableSort | undefined) => dispatch({ type: 'sort', sort }), []),
    reset: useCallback(() => dispatch({ type: 'reset' }), [])
  };
}
