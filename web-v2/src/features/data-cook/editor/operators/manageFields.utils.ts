import {
  EtlOperatorClassName,
  type EtlOperator,
  type ExpressionFieldConfiguration,
  type FieldConfiguration,
  type ManageFieldsOperator,
  type TableConfiguration
} from '@/core/data-cook/EtlOperator';
import { asString, type JsonObject } from '@/core/json/json';
import type { TableHeader } from '@/core/query/VisualizationResponse';
import { tableField, type SchemaColumn, type TableSchema } from '@/core/schema/SchemaService';
import { columnNameOf, FormulaError, toExpression } from '@/features/chart-builder/field-actions/formula.utils';
import { uniqueTableName } from '@/core/data-cook/etlGraph';
import { newOperatorBase } from './operators.utils';

/**
 * Manage Fields (v1 `ManageFields`): the columns of the table it reads, renamed, hidden or cast, and columns added
 * from an SQL expression. The server turns them into one select (`view_query`).
 */

/** v1's types a column can be cast to, in its order. */
export const AS_TYPES: readonly { value: string; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Datetime' },
  { value: 'datetime64', label: 'Datetime64' },
  { value: 'double', label: 'Double' },
  { value: 'float', label: 'Float' },
  { value: 'int8', label: 'Int8' },
  { value: 'int16', label: 'Int16' },
  { value: 'int32', label: 'Int32' },
  { value: 'int64', label: 'Int64' },
  { value: 'uint8', label: 'UInt8' },
  { value: 'uint16', label: 'UInt16' },
  { value: 'uint32', label: 'UInt32' },
  { value: 'uint64', label: 'UInt64' },
  { value: 'string', label: 'String' }
];

/** v1 `convertToAsType`: the cast a column of `type` starts with; `undefined` for a type it has none for. */
export function asTypeOf(type: string): string | undefined {
  switch (type) {
    case 'bool':
    case 'int8':
      return 'int8';
    case 'float64':
    case 'double':
      return 'double';
    case 'datetime':
    case 'datetime64':
      return 'datetime';
    case 'array':
    case 'nested':
    case 'string':
      return 'string';
    case 'int16':
    case 'int32':
    case 'int64':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'float':
    case 'date':
      return type;
    default:
      return undefined;
  }
}

/** The column a field reads (`field_name` of its `table_field`). */
export function fieldColumn(field: FieldConfiguration): string {
  return asString(field.field['field_name']);
}

/** Every column of `table`, shown and cast to its own type (v1 `makeNormalFields`). */
export function fieldsOfTable(table: TableSchema): FieldConfiguration[] {
  return table.columns.map(column => ({
    displayName: column.displayName || column.name,
    field: tableField(table, column),
    isHidden: false,
    asType: asTypeOf(column.type),
    scalarFunction: undefined
  }));
}

/**
 * The fields of an operator being edited on its table's columns now (v1 `mergeFields`): a column keeps its saved
 * field, a new column comes in as it is, a field whose column is gone goes. A saved field without a cast gets its
 * column's (v1 `makeOperator(resetAsType)`).
 */
export function mergeFields(fromTable: readonly FieldConfiguration[], saved: readonly FieldConfiguration[]): FieldConfiguration[] {
  const savedByColumn = new Map(saved.map(field => [fieldColumn(field), field]));
  return fromTable.map(field => {
    const kept = savedByColumn.get(fieldColumn(field));
    if (!kept) return field;
    return { ...kept, asType: kept.asType ?? asTypeOf(asString(kept.field['field_type'])) };
  });
}

/** v1 `ManageNormalField` and `ManageExpressionField`: a name is required, once among all fields (ignoring case). */
export function fieldNameError(name: string, otherNames: readonly string[]): string | undefined {
  const trimmed = name.trim();
  if (trimmed === '') return 'Please input field name';
  const lower = trimmed.toLowerCase();
  if (otherNames.some(other => other.trim().toLowerCase() === lower)) return 'This field name already exists';
  return undefined;
}

/** A field as the table lists it: a column of the table read, or an expression. */
export type FieldRow =
  | { readonly kind: 'field'; readonly index: number; readonly field: FieldConfiguration }
  | { readonly kind: 'expression'; readonly index: number; readonly field: ExpressionFieldConfiguration };

/** The fields then the expressions whose name or column holds `keyword` (v1's search). */
export function fieldRows(fields: readonly FieldConfiguration[], extraFields: readonly ExpressionFieldConfiguration[], keyword: string): FieldRow[] {
  const search = keyword.trim().toLowerCase();
  const matches = (...texts: string[]) => search === '' || texts.some(text => text.toLowerCase().includes(search));
  return [
    ...fields.flatMap((field, index): FieldRow[] => (matches(field.displayName, fieldColumn(field)) ? [{ kind: 'field', index, field }] : [])),
    ...extraFields.flatMap((field, index): FieldRow[] => (matches(field.displayName, field.fieldName) ? [{ kind: 'expression', index, field }] : []))
  ];
}

/** The names of every field but `row`'s, to keep a new name unique. */
export function otherFieldNames(fields: readonly FieldConfiguration[], extraFields: readonly ExpressionFieldConfiguration[], row?: Pick<FieldRow, 'kind' | 'index'>): string[] {
  return [
    ...fields.filter((_, index) => row?.kind !== 'field' || row.index !== index).map(field => field.displayName),
    ...extraFields.filter((_, index) => row?.kind !== 'expression' || row.index !== index).map(field => field.displayName)
  ];
}

/** A new expression field; its `field_name` comes from its name, unique among the other expressions. */
export function newExpressionField(displayName: string, expression: string, others: readonly ExpressionFieldConfiguration[]): ExpressionFieldConfiguration {
  const base = columnNameOf(displayName) || 'field';
  return { fieldName: uniqueTableName(base, new Set(others.map(field => field.fieldName))), displayName: displayName.trim(), expression, asType: undefined, isHidden: false };
}

/** What the sample query reads: every field shown, so a hidden one still has its values (v1 `makeOperator(resetIsHidden)`). */
export function sampleRequest(fields: readonly FieldConfiguration[], extraFields: readonly ExpressionFieldConfiguration[]) {
  return { fields: fields.map(field => ({ ...field, isHidden: false })), extraFields: extraFields.map(field => ({ ...field, isHidden: false })) };
}

/** The values of the column the sample names `label` (the server names each by its display name). */
export function sampleValues(headers: readonly TableHeader[], records: readonly JsonObject[], label: string): string[] {
  const key = headers.find(header => header.label === label)?.key;
  if (key === undefined) return [];
  return records.map(record => {
    const value = record[key];
    return value === null || value === undefined ? '--' : String(value);
  });
}

export function newManageFieldsOperator(
  parent: EtlOperator,
  destTable: TableConfiguration,
  fields: readonly FieldConfiguration[],
  extraFields: readonly ExpressionFieldConfiguration[]
): ManageFieldsOperator {
  return { ...newOperatorBase(EtlOperatorClassName.ManageFields, destTable), kind: 'manageFields', parent, fields, extraFields };
}

/** What the expression dialog checked: an error per input, or the expression to save. */
export type ExpressionCheck =
  | { readonly ok: true; readonly expression: string }
  | { readonly ok: false; readonly nameError: string | undefined; readonly formulaError: string | undefined };

/**
 * v1 `ManageExpressionField.submit`: a unique name and a formula, whose `[Display Name]`s become the columns' names
 * (v1 `ExpressionParser`).
 */
export function checkExpression(displayName: string, formula: string, otherNames: readonly string[], columns: readonly SchemaColumn[]): ExpressionCheck {
  const nameError = fieldNameError(displayName, otherNames);
  let formulaError: string | undefined;
  let expression = '';
  if (formula.trim() === '') formulaError = 'Please input field expression';
  else {
    try {
      expression = toExpression(formula, columns).trim();
    } catch (error) {
      if (!(error instanceof FormulaError)) throw error;
      formulaError = error.message;
    }
  }
  return nameError || formulaError ? { ok: false, nameError, formulaError } : { ok: true, expression };
}
