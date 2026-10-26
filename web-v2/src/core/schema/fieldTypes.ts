/** Column types as a field stores them in `field_type` (v1 `ColumnType`, `ChartUtils.is*Type`), any case. */

const NUMBER_TYPES = new Set(['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'float64', 'double']);
const DATE_TYPES = new Set(['date', 'datetime', 'datetime64']);

export function isNumberType(type: string): boolean {
  return NUMBER_TYPES.has(type.toLowerCase());
}

export function isDateType(type: string): boolean {
  return DATE_TYPES.has(type.toLowerCase());
}

export function isTextType(type: string): boolean {
  return type.toLowerCase() === 'string';
}

/** Which conditions a field can be filtered with (v1 `ConditionTypes`, `ConditionUtils.getFamilyTypeFromFieldType`). */
export const ConditionFamily = {
  String: 'string',
  Number: 'number',
  Date: 'date'
} as const;

export type ConditionFamily = (typeof ConditionFamily)[keyof typeof ConditionFamily];

/** `undefined` for types no filter supports (bool, arrays). */
export function conditionFamilyOf(type: string): ConditionFamily | undefined {
  if (isDateType(type)) return ConditionFamily.Date;
  if (isTextType(type)) return ConditionFamily.String;
  if (isNumberType(type)) return ConditionFamily.Number;
  return undefined;
}
