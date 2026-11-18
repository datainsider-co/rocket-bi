import { useMemo } from 'react';
import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';
import type { DrilldownResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { HighchartsChart, type HighchartsChartProps } from '@/shared/charts/HighchartsChart';
import { drillIndexOf, withDrillPath } from '../drillPath';
import '../drillPath.css';
import { buildDrilldownChartOptions, type DrilldownChartType } from './drilldownChartOptions';
import { levelPathOf } from './drilldownLevels.utils';
import { useDrilldownLevels } from './useDrilldownLevels';

interface DrilldownChartProps {
  type: DrilldownChartType;
  options: VizOptions;
  response: DrilldownResponse;
  themeColors: readonly string[];
  /** The chart's query setting, for the names of its legends and its value. */
  setting: JsonObject;
  onPointContextMenu?: HighchartsChartProps['onPointContextMenu'];
}

/**
 * A drilldown column, bar or pie (v1 `DrilldownChart`, `DrilldownPieChart`): a click on a point shows the next legend's
 * values under it, and the path in the subtitle leads back, the way the dashboard's own drill down shows its path.
 */
export function DrilldownChart({ type, options, response, themeColors, setting, onPointContextMenu }: DrilldownChartProps) {
  const { steps, drill, back } = useDrilldownLevels(response);
  const chartOptions = useMemo(() => {
    const legendNames = asArray(setting['legends']).map(legend => asString(asRecord(legend)['name']));
    const valueName = asString(asRecord(setting['value'])['name']);
    const built = buildDrilldownChartOptions({ type, options, response, steps, themeColors, valueName, onDrill: drill });
    return withDrillPath(built, levelPathOf(steps, legendNames));
  }, [type, options, response, steps, themeColors, setting, drill]);
  const goBack = (target: EventTarget) => {
    const index = drillIndexOf(target);
    if (index !== undefined) back(index);
  };
  return (
    // The path is HTML inside the chart's subtitle, so its clicks are caught here.
    <div role="presentation" className="size-full" onClick={event => goBack(event.target)} onKeyDown={event => event.key === 'Enter' && goBack(event.target)}>
      <HighchartsChart options={chartOptions} fill onPointContextMenu={onPointContextMenu} />
    </div>
  );
}
