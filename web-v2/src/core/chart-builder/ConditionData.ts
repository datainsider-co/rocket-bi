import { asArray, asBoolean, asNumber, asRecord, asString, isRecord, withoutUndefined, type JsonObject } from '@/core/json/json';
import { defaultCondition, inputOf } from '@/core/query/internalFilter';
import { ConditionFamily } from '@/core/schema/fieldTypes';
import { FieldKind, fieldKindOf } from './functions';

/** v1 `ConditionTypes`, a condition's `family_type`. */
export const ConditionFamilyType = {
  String: 'string',
  Number: 'number',
  Date: 'Date histogram'
} as const;

/**
 * One condition of the builder's Filter zone (v1 `ConditionData`), as stored in `extra_data.filters`. `subType` is the
 * condition's v1 name (`in`, `between`, ...). A condition with `controlId` takes its values from that chart control;
 * its `allValues` are then the control's value types, not values.
 */
export interface ConditionData {
  readonly id: number;
  /** Conditions of one group are and-ed together. */
  readonly groupId: number;
  readonly field: JsonObject;
  readonly tableName?: string;
  readonly columnName?: string;
  readonly isNested: boolean;
  readonly familyType: string;
  readonly subType?: string;
  readonly firstValue?: string;
  readonly secondValue?: string;
  readonly allValues: readonly string[];
  /** v1 `InputType` (`multi_select`, `text`, ...), what the editor asks for. */
  readonly currentInputType: string;
  /** v1 `FilterMode` (`range`, `selection`). */
  readonly filterModeSelected: string;
  readonly currentOptionSelected: string;
  readonly controlId?: number;
}

function optionalString(json: JsonObject, key: string): string | undefined {
  return typeof json[key] === 'string' ? json[key] : undefined;
}

export function conditionDataFromJson(value: unknown): ConditionData {
  const json = asRecord(value);
  return withoutUndefined<ConditionData>({
    id: asNumber(json['id']),
    groupId: asNumber(json['group_id']),
    field: asRecord(json['field']),
    tableName: optionalString(json, 'table_name'),
    columnName: optionalString(json, 'column_name'),
    isNested: asBoolean(json['is_nested']),
    familyType: asString(json['family_type']),
    subType: optionalString(json, 'sub_type'),
    firstValue: optionalString(json, 'first_value'),
    secondValue: optionalString(json, 'second_value'),
    allValues: asArray(json['all_values']).map(item => String(item)),
    currentInputType: asString(json['current_input_type']),
    filterModeSelected: asString(json['filter_mode_selected']),
    currentOptionSelected: asString(json['current_option_selected']),
    controlId: typeof json['control_id'] === 'number' ? json['control_id'] : undefined
  });
}

export function conditionDataToJson(data: ConditionData): JsonObject {
  return withoutUndefined<JsonObject>({
    id: data.id,
    group_id: data.groupId,
    field: data.field,
    table_name: data.tableName,
    column_name: data.columnName,
    is_nested: data.isNested,
    family_type: data.familyType,
    sub_type: data.subType,
    first_value: data.firstValue,
    second_value: data.secondValue,
    all_values: data.allValues,
    current_input_type: data.currentInputType,
    filter_mode_selected: data.filterModeSelected,
    current_option_selected: data.currentOptionSelected,
    control_id: data.controlId
  });
}

export function conditionDataListFromJson(value: unknown): ConditionData[] {
  return asArray(value).filter(isRecord).map(conditionDataFromJson);
}

const FAMILIES: Readonly<Record<string, [familyType: string, family: ConditionFamily]>> = {
  [FieldKind.Text]: [ConditionFamilyType.String, ConditionFamily.String],
  [FieldKind.Date]: [ConditionFamilyType.Date, ConditionFamily.Date]
};

export interface NewConditionInput {
  readonly id: number;
  readonly groupId: number;
  readonly field: JsonObject;
  readonly columnName: string;
  readonly tableName: string;
  readonly isNested?: boolean;
}

/**
 * A field just dropped into the Filter zone (v1 `FilterDraggable.createConditionNodeFrom` + `ChartUtils.toConditionData`):
 * its family's default condition (`in` for text, `equal` for numbers, `between` for dates) without values. v1 set
 * `current_option_selected` to `in` and `current_input_type` to `in` whatever the family; here they follow the
 * condition.
 */
export function newConditionData({ id, groupId, field, columnName, tableName, isNested = false }: NewConditionInput): ConditionData {
  const [familyType, family] = FAMILIES[fieldKindOf(field)] ?? [ConditionFamilyType.Number, ConditionFamily.Number];
  const condition = defaultCondition(family);
  return {
    id,
    groupId,
    field,
    tableName,
    columnName,
    isNested,
    familyType,
    subType: condition,
    firstValue: '',
    secondValue: '',
    allValues: [],
    currentInputType: inputOf(family, condition),
    filterModeSelected: 'range',
    currentOptionSelected: condition
  };
}
