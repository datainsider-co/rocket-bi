import type { JsonObject } from '@/core/json/json';
import { AggregationType, DateFunctionType, FunctionFamily } from './FunctionData';
import { FieldKind, fieldKindOf } from './functions';

/** Function types of a family, under a heading or not (v1 `FunctionNode.subFunctions`). */
export interface FunctionTypeGroup {
  readonly label?: string;
  readonly types: readonly string[];
}

const D = DateFunctionType;
const A = AggregationType;
const F = FunctionFamily;

/** v1 `DataBuilderConstants.*_FUNCTION_NODES`: date functions by kind. Week of Year is left out, as in v1. */
const DATE_GROUPS: readonly FunctionTypeGroup[] = [
  { label: 'Continuous', types: [D.SecondOf, D.MinuteOf, D.HourOf, D.DayOf, D.WeekOf, D.MonthOf, D.QuarterOf, D.YearlyOf] },
  {
    label: 'Periodic',
    types: [D.Year, D.QuarterOfYear, D.MonthOfYear, D.DayOfYear, D.DayOfMonth, D.DayOfWeek, D.HourOfDay, D.MinuteOfHour, D.SecondOfMinute]
  },
  { label: 'Timestamp', types: [D.Second, D.Millisecond, D.Nanosecond] }
];

/** Text and date columns can only be counted; First and Last were never offered. */
const COUNTS: readonly FunctionTypeGroup[] = [{ types: [A.CountDistinct, A.CountAll] }];
const NUMBER_AGGREGATIONS: readonly FunctionTypeGroup[] = [{ types: [A.Average, A.Sum, A.Maximum, A.Minimum, A.CountDistinct, A.CountAll] }];
const EXPRESSION: readonly FunctionTypeGroup[] = [{ types: [A.Expression] }];

const COLUMN_FAMILIES: readonly FunctionFamily[] = [F.GroupBy, F.DateHistogram, F.Aggregation, F.None];

/**
 * The families a zone item's menu offers for its field (v1 `ConfigDraggable.listAcceptableFunctions`): every family for
 * a column, aggregation for a measure, none for a chart control.
 */
export function familyOptionsOf(field: JsonObject): readonly FunctionFamily[] {
  switch (fieldKindOf(field)) {
    case FieldKind.Expression:
      return [F.Aggregation];
    case FieldKind.Control:
      return [];
    default:
      return COLUMN_FAMILIES;
  }
}

/** The types `family` offers for the field, in v1's menu order; none for families without a type. */
export function typeOptionsOf(field: JsonObject, family: string): readonly FunctionTypeGroup[] {
  const kind = fieldKindOf(field);
  if (kind === FieldKind.Control) return [];
  if (kind === FieldKind.Expression) return family === F.Aggregation ? EXPRESSION : [];
  if (family === F.DateHistogram) return DATE_GROUPS;
  if (family === F.Aggregation) return kind === FieldKind.Number ? NUMBER_AGGREGATIONS : COUNTS;
  return [];
}
