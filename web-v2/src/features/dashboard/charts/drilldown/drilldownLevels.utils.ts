import type { DrilldownPoint, DrilldownResponse } from '@/core/query/VisualizationResponse';

/** One click into a drilldown chart: the level it opened and the point that was clicked. */
export interface LevelStep {
  /** The level's id in the response: the clicked point's `drilldown`. */
  readonly id: string;
  /** The clicked point's name, shown in the path back. */
  readonly name: string;
}

/** What a drilldown chart draws at one moment: the first legend's points, or the points under a clicked one. */
export interface DrilldownLevelView {
  /** The level's own name (its id, as the server names it); `undefined` on the first level. */
  readonly name: string | undefined;
  readonly points: readonly DrilldownPoint[];
}

function levelIdsOf(response: DrilldownResponse): Set<string> {
  return new Set(response.drilldown.map(level => level.id));
}

/**
 * The steps the response still has, from the first on: a new response (a filter, another legend) may no longer hold the
 * level the viewer was on, and the chart then shows the deepest one it does.
 */
export function validLevelSteps(response: DrilldownResponse, steps: readonly LevelStep[]): LevelStep[] {
  const ids = levelIdsOf(response);
  const firstMissing = steps.findIndex(step => !ids.has(step.id));
  return firstMissing === -1 ? [...steps] : steps.slice(0, firstMissing);
}

/**
 * A level's points, each once. With a sort and three legends or more, the server repeats the points of every level
 * between the first and the last (same name, value and `drilldown`), an uneven number of times; v1 drew each copy,
 * which also skews a pie. A point's `drilldown` is its path, so two alike in one level are one group.
 */
function uniquePoints(points: readonly DrilldownPoint[]): DrilldownPoint[] {
  const seen = new Set<string>();
  return points.filter(point => {
    if (point.drilldown === undefined) return true;
    if (seen.has(point.drilldown)) return false;
    seen.add(point.drilldown);
    return true;
  });
}

/**
 * The level after `steps` (already valid, see `validLevelSteps`). A point keeps its `drilldown` only when the response
 * has that level: the server names one on every point, the last legend's included, and v1 gave those to Highcharts as
 * they were, so they looked clickable and did nothing.
 */
export function drilldownLevelOf(response: DrilldownResponse, steps: readonly LevelStep[]): DrilldownLevelView {
  const ids = levelIdsOf(response);
  const id = steps.at(-1)?.id;
  const level = id === undefined ? undefined : response.drilldown.find(item => item.id === id);
  const points = uniquePoints(level ? level.data : response.series);
  return {
    name: level?.name,
    points: points.map(({ drilldown, ...point }) => (drilldown !== undefined && ids.has(drilldown) ? { ...point, drilldown } : point))
  };
}

/**
 * The path back for `drillPathHtml`: each clicked value, and the legend the chart is on after it (`legendNames` are the
 * setting's legends, in order). A level past the names known has an empty one.
 */
export function levelPathOf(steps: readonly LevelStep[], legendNames: readonly string[]): { value: string; name: string }[] {
  return steps.map((step, index) => ({ value: step.name, name: legendNames[index + 1] ?? '' }));
}
