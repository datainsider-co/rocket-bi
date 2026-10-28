import { has } from 'lodash-es';
import type { JsonObject } from '@/core/json/json';
import { vizKey } from '@/core/query/vizOptions';
import { ChartType } from './chartType';
import type { FunctionData } from './FunctionData';
import { applyVizChanges, vizOptionsOf, type VizChanges } from './vizChanges';

type Configs = Readonly<Record<string, readonly FunctionData[]>>;

/**
 * What a chart type's viz options lose when its columns change (v1 `ChartOptionResolver`, `ChartOptionHandler`). Only
 * the collapse table has it so far; the pivot table comes with its type.
 */
interface OptionCleanup {
  /** The zone whose columns own formatting. */
  readonly zone: string;
  /** Whether the whole conditional formatting goes when the columns switch between grouping and listing rows. */
  readonly clearOnConvert: boolean;
}

const CLEANUPS: Readonly<Partial<Record<string, OptionCleanup>>> = {
  [ChartType.CollapseTable]: { zone: 'columns', clearOnConvert: true }
};

/** The changes whose path exists, so options without them stay as they are. */
function present(options: JsonObject, changes: VizChanges): VizChanges {
  const viz = vizOptionsOf(options);
  return Object.fromEntries(Object.entries(changes).filter(([path]) => has(viz, path)));
}

function withChanges(options: JsonObject, changes: VizChanges): JsonObject {
  const applied = present(options, changes);
  return Object.keys(applied).length > 0 ? applyVizChanges(options, applied) : options;
}

/**
 * The options once `removed` left `zone` (v1 `TableChartOptionHandler.handleFunctionRemoved`): its field formatting and
 * conditional formatting go, unless another column of the zone still has the same name. v1 also cleared them when an
 * item of the Sorting zone was removed, which took the formatting of a column still shown.
 */
export function optionsAfterRemove(chartType: string, zone: string, options: JsonObject, removed: FunctionData, configs: Configs): JsonObject {
  const cleanup = CLEANUPS[chartType];
  if (!cleanup || cleanup.zone !== zone) return options;
  const key = vizKey(removed.name);
  if ((configs[zone] ?? []).some(item => vizKey(item.name) === key)) return options;
  return withChanges(options, { [`fieldFormatting.${key}`]: undefined, [`conditionalFormatting.${key}`]: undefined });
}

/**
 * The options once the columns switched between grouping and listing rows (v1
 * `TableChartOptionHandler.handleFunctionConverted`): the conditional formatting goes, its summarization no longer
 * holds.
 */
export function optionsAfterConvert(chartType: string, options: JsonObject): JsonObject {
  return CLEANUPS[chartType]?.clearOnConvert ? withChanges(options, { conditionalFormatting: undefined }) : options;
}
