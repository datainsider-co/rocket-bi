import { useMemo } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import type { FilterRequestJson } from '@/core/query/QueryRequest';
import { useWidgetData } from '../../chart-data/useWidgetData';
import { vizFromSetting } from '@/core/query/vizOptions';
import { TabFilterDisplay, filterOptions, selectionOf, selectionToControl } from '../../charts/filter/filter.utils';
import { buildChartQuery } from '../../controls/chartQuery.utils';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { useDashboardControls } from '../../controls/DashboardControlsContext';
import { tabFilterCssVars, tabFilterLook } from '../../charts/filter/filterStyle.utils';
import { chartTitle } from './chartWidget.utils';
import { InnerFilterView } from './InnerFilterView';
import { useNarrowCard } from './useNarrowCard';

interface InnerFilterProps {
  /** The chart's `chartFilter`; its id is the control id of the selection. */
  filter: ChartWidget;
  dashboardId: number;
  /** The header filters its chart applies; v1 filtered the inner filter's values by them too. */
  headerRequests: readonly FilterRequestJson[];
}

/** Loads the inner filter's values (v1 `renderAllInnerFilters`) and keeps its selection as a control. */
export function InnerFilter({ filter, dashboardId, headerRequests }: InnerFilterProps) {
  const { controls, widgets, entryOf, setControl } = useDashboardControls();
  const query = useMemo(() => buildChartQuery(filter, controls, widgets, headerRequests), [filter, controls, widgets, headerRequests]);
  const data = useWidgetData(filter, { dashboardId, query });
  const options = useMemo(() => (data.data?.kind === 'table' ? filterOptions(data.data, true) : []), [data.data]);
  const look = useMemo(() => tabFilterLook(vizFromSetting(filter.setting).options), [filter.setting]);
  const style = useMemo(() => tabFilterCssVars(look.colors), [look.colors]);
  const { ref, narrow } = useNarrowCard<HTMLDivElement>();
  return (
    <div ref={ref} className={`inner-filter ${GRID_NO_DRAG_CLASS}`}>
      <InnerFilterView
        label={chartTitle(filter)}
        options={options}
        selected={selectionOf(entryOf(filter.id))}
        loading={data.isFetching}
        asTabs={look.displayAs === TabFilterDisplay.Normal}
        compact={narrow}
        style={style}
        onChange={values => setControl(filter.id, selectionToControl(values))}
      />
    </div>
  );
}
