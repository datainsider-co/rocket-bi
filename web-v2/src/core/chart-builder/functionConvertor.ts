import { ChartType } from './chartType';
import { AggregationType, DateFunctionType, FunctionFamily, type FunctionData } from './FunctionData';
import { FieldKind, fieldKindOf } from './functions';

type Configs = Readonly<Record<string, readonly FunctionData[]>>;

/** Whether an item groups (group by, date histogram, aggregation) or lists rows as they are (none). */
type RowMode = 'group' | 'none' | 'unknown';

function rowModeOf(item: FunctionData | undefined): RowMode {
  switch (item?.functionFamily) {
    case FunctionFamily.GroupBy:
    case FunctionFamily.DateHistogram:
    case FunctionFamily.Aggregation:
      return 'group';
    case FunctionFamily.None:
      return 'none';
    default:
      return 'unknown';
  }
}

/** v1 `FunctionConvertor.convertToGroupBy` / `convertToNone`; measures and other fields keep their function. */
function toMode(item: FunctionData, mode: RowMode): FunctionData {
  const kind = fieldKindOf(item.field);
  const isColumn = kind === FieldKind.Text || kind === FieldKind.Number || kind === FieldKind.Date;
  if (!isColumn || mode === 'unknown') return item;
  if (mode === 'none') return { ...item, functionFamily: FunctionFamily.None, functionType: '' };
  return kind === FieldKind.Date
    ? { ...item, functionFamily: FunctionFamily.DateHistogram, functionType: DateFunctionType.Year }
    : { ...item, functionFamily: FunctionFamily.GroupBy, functionType: '' };
}

/** The chart types whose columns must all group or all list rows (v1 `TableFunctionConvertor`). */
const ROW_MODE_TYPES = new Set<string>([ChartType.Table, ChartType.CollapseTable]);

/**
 * After a table column switches between grouping and listing rows, the other items follow it (v1
 * `TableFunctionConvertor`): a table can't mix both. Chart controls are left as they are. Other chart types and other
 * changes give `configs` back unchanged.
 */
export function convertRowMode(chartType: string, zone: string, configs: Configs, updated: FunctionData, previous: FunctionData | undefined): Configs {
  const mode = rowModeOf(updated);
  if (!ROW_MODE_TYPES.has(chartType) || zone !== 'columns' || mode === rowModeOf(previous)) return configs;
  return Object.fromEntries(
    Object.entries(configs).map(([key, items]) => [
      key,
      items.map(item => (item.id === updated.id || item.dynamicFunction || rowModeOf(item) === mode ? item : toMode(item, mode)))
    ])
  );
}

/** v1 `FunctionConvertor.convertToAggregation`: numbers summed, text and dates counted; measures and other fields keep their function. */
function toAggregation(item: FunctionData): FunctionData {
  const kind = fieldKindOf(item.field);
  if (kind !== FieldKind.Text && kind !== FieldKind.Number && kind !== FieldKind.Date) return item;
  return { ...item, functionFamily: FunctionFamily.Aggregation, functionType: kind === FieldKind.Number ? AggregationType.Sum : AggregationType.CountAll };
}

/**
 * After a scatter's Legend switches between grouping and listing rows, the axes follow it (v1
 * `ScatterFunctionConvertor`): with a grouping legend they aggregate, one dot per group; with a plain one they list rows.
 * An axis already aggregating keeps its function (v1 reset it to the default) and chart controls are left as they are.
 * v1's `BubbleFunctionConvertor` only reacts to a switch its zones don't offer, so bubbles have no rule.
 */
export function convertScatterAxes(chartType: string, zone: string, configs: Configs, updated: FunctionData, previous: FunctionData | undefined): Configs {
  const mode = rowModeOf(updated);
  if (chartType !== ChartType.Scatter || zone !== 'legend_optional' || mode === 'unknown' || mode === rowModeOf(previous)) return configs;
  const convert = (item: FunctionData) => {
    if (item.dynamicFunction) return item;
    if (mode === 'none') return toMode(item, 'none');
    return item.functionFamily === FunctionFamily.Aggregation ? item : toAggregation(item);
  };
  return Object.fromEntries(Object.entries(configs).map(([key, items]) => [key, key === zone ? items : items.map(convert)]));
}

/** Every chart type's rule for the other items after one changed its function (v1 `FunctionConvertResolver`). */
export function convertFunctions(chartType: string, zone: string, configs: Configs, updated: FunctionData, previous: FunctionData | undefined): Configs {
  const byRowMode = convertRowMode(chartType, zone, configs, updated, previous);
  return byRowMode === configs ? convertScatterAxes(chartType, zone, configs, updated, previous) : byRowMode;
}
