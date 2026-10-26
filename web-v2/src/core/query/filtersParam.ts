import { asArray, asString, isRecord, type JsonObject } from '@/core/json/json';
import { defaultCondition, familyOf, FilterInput, inputOf, isFilterCondition, type InternalFilter } from './internalFilter';

/**
 * `?filters=` of a dashboard URL: the filters drill through opened it with. v1 wrote `JSON.stringify` of its
 * `InternalFilter` objects, so the keys are camelCase, its field's too (`dbName`, `tblName`), while the server's field
 * is snake_case. Both sides are mapped here key by key, so links from v1 open in v2 and the other way round.
 */
export const FILTERS_PARAM = 'filters';

/** v1 `FilterMode`: which of its two editors a filter opens in. */
const FilterMode = { Range: 'range', Selection: 'selection' } as const;

function fieldFromParam(value: unknown): JsonObject | undefined {
  if (!isRecord(value)) return undefined;
  const fieldName = asString(value['fieldName']);
  const fieldType = asString(value['fieldType']);
  switch (value['className']) {
    case 'table_field':
      return {
        class_name: 'table_field',
        db_name: asString(value['dbName']),
        tbl_name: asString(value['tblName']),
        field_name: fieldName,
        field_type: fieldType
      };
    case 'view_field':
      return { class_name: 'view_field', view_name: asString(value['viewName']), field_name: fieldName, field_type: fieldType };
    default:
      // Expression and calculated fields come from ChartBuilder, never from drill through.
      return undefined;
  }
}

function fieldToParam(field: JsonObject): JsonObject {
  const common = { fieldName: field['field_name'], fieldType: field['field_type'] };
  if (field['class_name'] === 'view_field') return { className: 'view_field', viewName: field['view_name'], ...common };
  return { className: 'table_field', dbName: field['db_name'], tblName: field['tbl_name'], ...common };
}

/** One v1 filter, with the given id (v1 drew a random one); `undefined` when its field can't be read. */
export function filterFromParam(value: unknown, id: number): InternalFilter | undefined {
  if (!isRecord(value)) return undefined;
  const field = fieldFromParam(value['field']);
  if (!field) return undefined;
  const stored = value['currentOptionSelected'];
  return {
    id,
    name: asString(value['name']),
    field,
    condition: isFilterCondition(stored) ? stored : defaultCondition(familyOf({ field })),
    values: asArray(value['currentValues']).map(String),
    enabled: value['isEnable'] !== false,
    nested: value['isNested'] === true
  };
}

export function filterToParam(filter: InternalFilter): JsonObject {
  const input = inputOf(familyOf(filter), filter.condition);
  return {
    className: 'dynamic_filter',
    id: filter.id,
    name: filter.name,
    field: fieldToParam(filter.field),
    currentValues: [...filter.values],
    currentOptionSelected: filter.condition,
    currentInputType: input,
    // v1 opens multi selects in its Selection editor, the rest in its Range editor.
    filterModeSelected: input === FilterInput.MultiSelect ? FilterMode.Selection : FilterMode.Range,
    isEnable: filter.enabled,
    isNested: filter.nested,
    controlId: null
  };
}

/** The filters of a `?filters=` value, ids -1, -2, ...; nothing for a missing or broken value (v1 too). */
export function parseFiltersParam(param: string | null): InternalFilter[] {
  if (!param) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(param);
  } catch {
    return [];
  }
  return asArray(parsed).flatMap((value, index) => filterFromParam(value, -(index + 1)) ?? []);
}

export function toFiltersParam(filters: readonly InternalFilter[]): string {
  return JSON.stringify(filters.map(filterToParam));
}
