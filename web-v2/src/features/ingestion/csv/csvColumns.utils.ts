import type { CsvColumn } from '@/core/ingestion/CsvImport';
import type { SchemaColumn } from '@/core/schema/SchemaService';
import { toIdentifier } from '@/shared/schema/identifier.utils';

/** The types v1 offered (`COLUMN_DATA_TYPE`); the server may detect others (`datetime64`), shown by their name. */
export const CSV_COLUMN_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'bool', label: 'Bool' },
  { value: 'int32', label: 'Int32' },
  { value: 'int64', label: 'Int64' },
  { value: 'double', label: 'Double' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'DateTime' }
] as const;

export function columnTypeLabel(type: string): string {
  return CSV_COLUMN_TYPES.find(option => option.value === type)?.label ?? type;
}

export function renameColumn(columns: readonly CsvColumn[], index: number, name: string): CsvColumn[] {
  return columns.map((column, at) => (at === index ? { ...column, name } : column));
}

export function setColumnType(columns: readonly CsvColumn[], index: number, type: string): CsvColumn[] {
  return columns.map((column, at) => (at === index ? { ...column, type } : column));
}

/** One message per column, `undefined` when it is fine: a name is required and must differ once stored. */
export function columnErrors(columns: readonly CsvColumn[]): (string | undefined)[] {
  const counts = new Map<string, number>();
  for (const column of columns) {
    const id = toIdentifier(column.name);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return columns.map(column => {
    if (column.name.trim() === '') return 'Name is required';
    return (counts.get(toIdentifier(column.name)) ?? 0) > 1 ? 'Duplicate name' : undefined;
  });
}

/** Per column, the preview rows where the value is empty or did not convert to the column's type. */
export function nullCounts(records: readonly (readonly unknown[])[], columnCount: number): number[] {
  return Array.from({ length: columnCount }, (_, index) =>
    records.reduce<number>((count, record) => (record[index] == null ? count + 1 : count), 0)
  );
}

/**
 * Why the file can't go into an existing table, or `undefined` when it can. `ingestion/csv` inserts by position, so
 * the columns must be the table's, in its order, with its types (v1 `isMatchingSchema`).
 */
export function tableMismatch(columns: readonly CsvColumn[], tableColumns: readonly SchemaColumn[]): string | undefined {
  if (columns.length !== tableColumns.length) {
    return `The table has ${tableColumns.length} columns and the file ${columns.length}. Pick another table or type a new name.`;
  }
  const index = columns.findIndex((column, at) => {
    const tableColumn = tableColumns[at];
    return toIdentifier(column.name) !== tableColumn?.name || column.type !== tableColumn.type;
  });
  if (index === -1) return undefined;
  const column = columns[index];
  const tableColumn = tableColumns[index];
  return (
    `Column ${index + 1} is ${tableColumn?.name} (${columnTypeLabel(tableColumn?.type ?? '')}) in the table and ` +
    `${column?.name} (${columnTypeLabel(column?.type ?? '')}) in the file. Pick another table or type a new name.`
  );
}
