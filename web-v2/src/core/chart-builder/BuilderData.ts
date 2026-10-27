import { asRecord, asString, type JsonObject } from '@/core/json/json';
import { conditionDataListFromJson, conditionDataToJson, type ConditionData } from './ConditionData';
import { functionDataListFromJson, functionDataToJson, type FunctionData } from './FunctionData';

/**
 * What the builder keeps of a chart, in its `extra_data` (v1 `WidgetExtraData`): the items of each zone, the filter
 * groups and the picked chart type. Zone keys are the stored ones (`x_axis`, `legend_optional`): v1's key renaming
 * turned its `ConfigType` names into these, and v1 reads them back with `camelCase`. Filter groups are keyed by their
 * group id.
 */
export interface BuilderData {
  readonly chartType: string;
  readonly configs: Readonly<Record<string, readonly FunctionData[]>>;
  readonly filters: Readonly<Record<string, readonly ConditionData[]>>;
}

export const EMPTY_BUILDER_DATA: BuilderData = { chartType: '', configs: {}, filters: {} };

function mapValues<V, T>(record: Readonly<Record<string, V>>, map: (value: V) => T): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, map(value)]));
}

export function builderDataFromJson(extraData: unknown): BuilderData {
  const json = asRecord(extraData);
  return {
    chartType: asString(json['current_chart_type']),
    configs: mapValues(asRecord(json['configs']), functionDataListFromJson),
    filters: mapValues(asRecord(json['filters']), conditionDataListFromJson)
  };
}

/** The keys of `extra_data` the builder owns; the caller merges them over the stored ones. */
export function builderDataToJson(data: BuilderData): JsonObject {
  return {
    configs: mapValues(data.configs, items => items.map(functionDataToJson)),
    filters: mapValues(data.filters, items => items.map(conditionDataToJson)),
    current_chart_type: data.chartType
  };
}
