import dayjs from 'dayjs';
import { z } from 'zod';
import { isDateType, isNumberType, isTextType } from '@/core/schema/fieldTypes';
import { newColumn, TableKind, type ColumnDefinition, type DefaultValue, type TableDefinition } from '@/core/schema/TableDefinition';
import { toIdentifier } from '@/shared/schema/identifier.utils';

/**
 * Editing a table's columns on the Schema page (v1 `FieldManagement` in edit and create modes) and naming a new table
 * (v1 `TableManagement.ensureTableName`). Columns are never removed: the existing ones keep their place in the form,
 * new ones come after them, so the form's row `i` is the table's column `i`.
 */

/** v1's limit on a column's display name and description. */
export const TEXT_MAX_LENGTH = 255;

/** One row of the column form. */
export interface ColumnValues {
  /** Typed for a new column, fixed for an existing one. */
  readonly name: string;
  readonly displayName: string;
  readonly type: string;
  readonly isNullable: boolean;
  readonly description: string;
  readonly defaultValue?: DefaultValue | undefined;
  readonly isNew: boolean;
}

export interface SchemaFormValues {
  readonly columns: ColumnValues[];
}

/** What input a column's default value takes, by its type (v1 `isBoolColumn`, `isTextColumn`, `isDateColumn`). */
export type DefaultValueKind = 'bool' | 'number' | 'text' | 'date' | 'none';

export function defaultValueKindOf(type: string): DefaultValueKind {
  if (type === 'bool') return 'bool';
  if (isNumberType(type)) return 'number';
  if (isTextType(type)) return 'text';
  if (isDateType(type)) return 'date';
  return 'none';
}

/**
 * The default value as the input of its kind holds it: a number or a timestamp read as text becomes one, a value of
 * another kind shows as none. Types without an input keep theirs.
 */
export function defaultValueFor(kind: DefaultValueKind, value: DefaultValue | undefined): DefaultValue | undefined {
  switch (kind) {
    case 'bool':
      return typeof value === 'boolean' ? value : undefined;
    case 'number':
      if (typeof value === 'number') return value;
      return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : undefined;
    case 'text':
      return value === undefined ? undefined : String(value);
    case 'date':
      if (typeof value === 'number') return value;
      return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? Date.parse(value) : undefined;
    case 'none':
      return value;
  }
}

/** A date type with a time of day takes a date and a time. */
export function hasTime(type: string): boolean {
  return type === 'datetime' || type === 'datetime64';
}

/** The Default Value cell outside edit mode: a date column's timestamp as a date, in the browser's time zone. */
export function formatDefaultValue(type: string, value: DefaultValue | undefined): string {
  if (value === undefined || value === '') return '--';
  const date = defaultValueKindOf(type) === 'date' ? defaultValueFor('date', value) : undefined;
  if (typeof date === 'number') return dayjs(date).format(hasTime(type) ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
  return String(value);
}

/** v1 added a nullable string column. */
export function newColumnValues(): ColumnValues {
  return { name: '', displayName: '', type: 'string', isNullable: true, description: '', defaultValue: undefined, isNew: true };
}

export function columnValuesOf(column: ColumnDefinition): ColumnValues {
  const { name, displayName, type, isNullable, description, defaultValue } = column;
  return { name, displayName, type, isNullable, description, defaultValue: defaultValueFor(defaultValueKindOf(type), defaultValue), isNew: false };
}

/** The form of a table's columns; a table to create starts with one new column, like v1. */
export function schemaFormValuesOf(columns: readonly ColumnDefinition[]): SchemaFormValues {
  return { columns: columns.length > 0 ? columns.map(columnValuesOf) : [newColumnValues()] };
}

/** A column given another type keeps its default value only when the new type takes the same kind of value. */
export function withType(column: ColumnValues, type: string): ColumnValues {
  const kind = defaultValueKindOf(type);
  return { ...column, type, defaultValue: kind === defaultValueKindOf(column.type) ? column.defaultValue : undefined };
}

/** A name the server keeps as it is (it turns other characters into `_`), not starting with a digit. */
const COLUMN_NAME = /^[A-Za-z_]\w*$/;

/**
 * The column form: new columns need a name of their own (`taken` holds the table's names in use, lower case, measures
 * and calculated columns too), every text stays within v1's limits, and a table keeps at least one column.
 */
export function schemaFormSchema(taken: ReadonlySet<string>) {
  const text = (label: string) => z.string().max(TEXT_MAX_LENGTH, `${label} must be at most ${TEXT_MAX_LENGTH} characters`);
  const column = z.object({
    name: z.string().trim(),
    displayName: text('Display name'),
    type: z.string().min(1, 'Type is required'),
    isNullable: z.boolean(),
    description: text('Description'),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    isNew: z.boolean()
  });
  return z.object({ columns: z.array(column).min(1, 'A table needs a column') }).superRefine(({ columns }, ctx) => {
    const seen = new Set<string>();
    columns.forEach((item, index) => {
      if (!item.isNew) return;
      const path = ['columns', index, 'name'];
      const lower = item.name.toLowerCase();
      if (item.name === '') ctx.addIssue({ code: 'custom', path, message: 'Column name is required' });
      else if (!COLUMN_NAME.test(item.name)) ctx.addIssue({ code: 'custom', path, message: 'Use letters, digits and _, not starting with a digit' });
      else if (taken.has(lower) || seen.has(lower)) ctx.addIssue({ code: 'custom', path, message: 'A column with this name already exists' });
      seen.add(lower);
    });
  });
}

/** Every name in use in a table, lower case, measures and calculated columns too: a new column can't take one. */
export function takenColumnNames(table: Pick<TableDefinition, 'json'>): Set<string> {
  const names = ['columns', 'expression_columns', 'calculated_columns'].flatMap(key => {
    const columns = table.json[key];
    return Array.isArray(columns) ? columns.map(column => String((column as { name?: unknown }).name ?? '')) : [];
  });
  return new Set(names.filter(Boolean).map(name => name.toLowerCase()));
}

/** A blank text default means none; numbers and booleans are kept as they are. */
function defaultValueOf(value: DefaultValue | undefined): DefaultValue | undefined {
  return typeof value === 'string' && value === '' ? undefined : value;
}

/**
 * The table's columns after the form: row `i` edits column `i` (the JSON it was read from goes along), the rows after
 * them are new columns. A new column without a display name shows its name (v1 `replaceDisplayNameEmpty`).
 */
export function toColumnDefinitions(values: SchemaFormValues, original: readonly ColumnDefinition[]): ColumnDefinition[] {
  return values.columns.map((row, index) => {
    const base = (!row.isNew && original[index]) || newColumn(row.name.trim(), row.type);
    return {
      ...base,
      displayName: row.displayName.trim() || base.displayName,
      type: row.type,
      isNullable: row.isNullable,
      description: row.description.trim(),
      defaultValue: defaultValueOf(row.defaultValue)
    };
  });
}

/** Whether a save changes the type of a column that holds data, which v1 confirmed first. */
export function changesType(values: SchemaFormValues, original: readonly ColumnDefinition[]): boolean {
  return values.columns.some((row, index) => !row.isNew && original[index] !== undefined && original[index].type !== row.type);
}

/** v1's confirmation before a type change. */
export const TYPE_CHANGE_MESSAGE = 'Your data could be lost if you change the data type of a column. Are you sure you want to save the table?';

/** Only tables of data can have their columns edited; a view's come from its query (v1 `isReadonlyTable`). */
export function canEditSchema(table: Pick<TableDefinition, 'tableType'>): boolean {
  return table.tableType === TableKind.Default || table.tableType === TableKind.Materialized;
}

/** v1's limit on a table name. */
export const TABLE_NAME_MAX_LENGTH = 250;

/** The name a new table gets from what was typed: lowercase word characters, without Vietnamese marks. */
export function toTableName(typed: string): string {
  return toIdentifier(typed).toLowerCase().replace(/^_+|_+$/g, '');
}

/** Why `typed` can't name a new table of a database whose tables are `existing` (names), or `undefined`. */
export function tableNameError(typed: string, existing: readonly string[]): string | undefined {
  const trimmed = typed.trim();
  if (trimmed === '') return 'Table name is required';
  if (trimmed.length > TABLE_NAME_MAX_LENGTH) return `Max length is ${TABLE_NAME_MAX_LENGTH} characters`;
  if (/[\\/?*"<>:|]/.test(trimmed)) return 'Table name can\'t contain any of the following characters: \\ / ? * " < > : |';
  const name = toTableName(trimmed);
  if (name === '') return 'Use letters or digits';
  if (existing.some(table => table.toLowerCase() === name)) return `Table ${name} already exists`;
  return undefined;
}

/** The Create Table form: the name must make a new table (`tableNameError`). */
export function createTableSchema(existing: readonly string[]) {
  return z.object({
    name: z.string().superRefine((value, ctx) => {
      const message = tableNameError(value, existing);
      if (message) ctx.addIssue({ code: 'custom', message });
    })
  });
}

export type CreateTableForm = z.infer<ReturnType<typeof createTableSchema>>;

/** A table about to be created: named, not yet given its columns. */
export interface NewTableName {
  readonly dbName: string;
  readonly name: string;
  readonly displayName: string;
}
