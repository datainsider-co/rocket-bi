import { ChartType } from './chartType';
import { DateFunctionType, FunctionFamily, type FunctionData } from './FunctionData';
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
const ROW_MODE_TYPES = new Set<string>([ChartType.Table]);

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
