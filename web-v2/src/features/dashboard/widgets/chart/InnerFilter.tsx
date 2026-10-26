import { useMemo } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { useWidgetData } from '../../chart-data/useWidgetData';
import { filterOptions, selectionOf, selectionToControl } from '../../charts/filter/filter.utils';
import { buildChartQuery } from '../../controls/chartQuery.utils';
import { useDashboardControls } from '../../controls/DashboardControlsContext';
import { chartTitle } from './chartWidget.utils';
import { InnerFilterView } from './InnerFilterView';

interface InnerFilterProps {
  /** The chart's `chartFilter`; its id is the control id of the selection. */
  filter: ChartWidget;
  dashboardId: number;
}

/** Loads the inner filter's values (v1 `renderAllInnerFilters`) and keeps its selection as a control. */
export function InnerFilter({ filter, dashboardId }: InnerFilterProps) {
  const { controls, widgets, entryOf, setControl } = useDashboardControls();
  const query = useMemo(() => buildChartQuery(filter, controls, widgets), [filter, controls, widgets]);
  const data = useWidgetData(filter, { dashboardId, query });
  const options = useMemo(() => (data.data?.kind === 'table' ? filterOptions(data.data, true) : []), [data.data]);
  return (
    <InnerFilterView
      label={chartTitle(filter)}
      options={options}
      selected={selectionOf(entryOf(filter.id))}
      loading={data.isFetching}
      onChange={values => setControl(filter.id, selectionToControl(values))}
    />
  );
}
