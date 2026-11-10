import { ChartType } from '@/core/chart-builder/chartType';
import { EtlOperatorClassName, type EtlOperator, type QuerySettingOperator, type TableConfiguration } from '@/core/data-cook/EtlOperator';
import { asRecord, asString, type JsonObject } from '@/core/json/json';
import { newOperatorBase } from '../operators.utils';

/**
 * Transform Table and Pivot Table (v1 `TransformTable`, `PivotTable` with the data-cook `ChartBuilder`): a table chart's
 * query setting on the table the operator reads. v1 built them as a Flatten Table and a Flatten Pivot Table. v2's
 * builder has no Flatten Pivot: its Pivot Table has the same zones. The server stores a pivot operator's
 * `flatten_pivot_table_chart_setting` as `pivot_table_chart_setting` and builds both the same flat table (DC8), so v2
 * stores the pivot class; only the builder's preview asks for the flat one.
 */

export type ChartOperatorKind = QuerySettingOperator['kind'];

const PIVOT_CLASS = 'pivot_table_chart_setting';
const FLATTEN_PIVOT_CLASS = 'flatten_pivot_table_chart_setting';
const FLATTEN_PIVOT_TYPE = 'flatten_pivot_table';
const CHART_TYPE_KEY = 'current_chart_type';

/** The builder's chart type for the operator: fixed, the builder offers no other. */
export function builderChartTypeOf(kind: ChartOperatorKind): string {
  return kind === 'transform' ? ChartType.Table : ChartType.PivotTable;
}

/** The query the operator stores: the builder's setting without its viz options (the server keeps `options: {}`, DC0). */
export function storedQueryOf(setting: JsonObject): JsonObject {
  return { ...setting, options: {} };
}

/** The stored query as the builder reads it: a flatten pivot (v1's, before the server renamed it) as a pivot. */
export function builderSettingOf(kind: ChartOperatorKind, query: JsonObject): JsonObject {
  return kind === 'pivot' && asString(query['class_name']) === FLATTEN_PIVOT_CLASS ? { ...query, class_name: PIVOT_CLASS } : query;
}

/** What the builder's preview queries: the table the operator builds, a pivot flat (`Offline - total_revenue`, ...). */
export function previewQueryOf(kind: ChartOperatorKind, setting: JsonObject): JsonObject {
  const query = storedQueryOf(setting);
  return kind === 'pivot' && asString(setting['class_name']) === PIVOT_CLASS ? { ...query, class_name: FLATTEN_PIVOT_CLASS } : query;
}

/** The builder's state as v1 stored it in `extra_data.render_options` (a chart's `extra_data`), a pivot as a flatten pivot. */
export function storedRenderOptionsOf(kind: ChartOperatorKind, extraData: JsonObject): JsonObject {
  return { ...extraData, [CHART_TYPE_KEY]: kind === 'pivot' ? FLATTEN_PIVOT_TYPE : ChartType.Table };
}

/** What the builder opens on: the stored query and builder state, or an empty chart of the operator's type. */
export function builderWidgetOf(kind: ChartOperatorKind, editing: QuerySettingOperator | undefined, renderOptions: JsonObject | undefined): { widget: JsonObject } | { chartType: string } {
  if (!editing) return { chartType: builderChartTypeOf(kind) };
  const extraData = { ...asRecord(renderOptions), [CHART_TYPE_KEY]: builderChartTypeOf(kind) };
  return { widget: { setting: builderSettingOf(kind, editing.query), extra_data: extraData } };
}

const CLASS_NAMES = { transform: EtlOperatorClassName.Transform, pivot: EtlOperatorClassName.Pivot } as const;

export function newQueryOperator(kind: ChartOperatorKind, parent: EtlOperator, destTable: TableConfiguration, query: JsonObject): QuerySettingOperator {
  return { ...newOperatorBase(CLASS_NAMES[kind], destTable), kind, parent, query };
}
