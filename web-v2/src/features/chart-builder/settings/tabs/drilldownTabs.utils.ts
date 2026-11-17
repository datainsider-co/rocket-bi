import type { VizChanges } from '@/core/chart-builder/vizChanges';

/** The Data Label tab's keys v1 `DrilldownSetting` wrote a second time, under the series' first level. */
const MIRRORED: Readonly<Record<string, string>> = {
  'plotOptions.series.dataLabels.enabled': 'plotOptions.series.levels[0].dataLabels.enabled',
  'plotOptions.series.dataLabels.style.color': 'plotOptions.series.levels[0].dataLabels.style.color'
};

/**
 * The Data Label tab's changes as v1 `DrilldownSetting.handleSettingChanged` stored them: whether the labels show and
 * their color go under `plotOptions.series.levels[0].dataLabels` as well, so the options read the same in v1. Highcharts
 * reads `levels` for tree maps only (v1 copied this from `TreeMapSetting`); the charts draw from `series.dataLabels`.
 * Revert is mirrored too, which v1 left out, leaving the two apart.
 */
export function withLevelLabels(changes: VizChanges): VizChanges {
  const mirrored = Object.entries(changes).flatMap(([path, value]) => {
    const copy = MIRRORED[path];
    return copy === undefined ? [] : [[copy, value] as const];
  });
  return mirrored.length === 0 ? changes : { ...changes, ...Object.fromEntries(mirrored) };
}
