import { useCallback, useMemo, useState } from 'react';
import type { DrilldownResponse } from '@/core/query/VisualizationResponse';
import { validLevelSteps, type LevelStep } from './drilldownLevels.utils';

/**
 * Where the viewer is inside a drilldown chart: the levels clicked into, kept while the response still has them. The
 * state is React's, not Highcharts' drilldown module's: `HighchartsChart` updates the chart on every render, which
 * puts the module's chart back on its first level while it still counts itself as drilled.
 */
export function useDrilldownLevels(response: DrilldownResponse) {
  const [clicked, setClicked] = useState<readonly LevelStep[]>([]);
  const steps = useMemo(() => validLevelSteps(response, clicked), [response, clicked]);
  const drill = useCallback((step: LevelStep) => setClicked(previous => [...validLevelSteps(response, previous), step]), [response]);
  /** Back to the chart as it was before step `index`. */
  const back = useCallback((index: number) => setClicked(previous => previous.slice(0, Math.max(index, 0))), []);
  return { steps, drill, back };
}
