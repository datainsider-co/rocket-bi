import { z } from 'zod';
import type { CsvColumn } from '@/core/ingestion/CsvImport';
import type { SchemaColumn, TableSchema } from '@/core/schema/SchemaService';
import { requiredError } from '@/shared/form/fieldErrors';
import { tableMismatch, toIdentifier } from './csvColumns.utils';

export const csvDestinationSchema = z
  .object({
    /** A listed database, or a name for a new one. */
    databaseName: z.string(),
    /** A listed table, or a name for a new one. */
    tableName: z.string()
  })
  .superRefine((values, ctx) => {
    const fail = (path: string[], message: string | undefined) => {
      if (message) ctx.addIssue({ code: 'custom', path, message });
    };
    fail(['databaseName'], requiredError(values.databaseName, 'Database'));
    fail(['tableName'], requiredError(values.tableName, 'Table'));
  });

export type CsvDestinationValues = z.infer<typeof csvDestinationSchema>;

export const EMPTY_DESTINATION: CsvDestinationValues = { databaseName: '', tableName: '' };

export type CsvDestinationTable =
  | { readonly kind: 'new'; readonly name: string; readonly displayName: string }
  | { readonly kind: 'existing'; readonly name: string; readonly columns: readonly SchemaColumn[] };

/** Where the rows go. `ingestion/csv/schema` creates a database that is missing. */
export interface CsvDestination {
  readonly dbName: string;
  readonly isNewDatabase: boolean;
  readonly table: CsvDestinationTable;
}

/** A name matches a listed one as typed or as the server would store it (`Sales 2024` → `Sales_2024`). */
function findListed<T>(items: readonly T[], nameOf: (item: T) => string, typed: string): T | undefined {
  return items.find(item => nameOf(item) === typed) ?? items.find(item => nameOf(item) === toIdentifier(typed));
}

/**
 * The database and table the values name. A new name is stored the way the server stores names; the server leaves a
 * database name as sent, so v2 converts it. A new database has no tables, so its table is new too.
 */
export function resolveDestination(
  values: CsvDestinationValues,
  databases: readonly string[],
  tables: readonly TableSchema[]
): CsvDestination {
  const databaseName = values.databaseName.trim();
  const tableName = values.tableName.trim();
  const listedDatabase = findListed(databases, name => name, databaseName);
  const listedTable = listedDatabase === undefined ? undefined : findListed(tables, table => table.name, tableName);
  return {
    dbName: listedDatabase ?? toIdentifier(databaseName),
    isNewDatabase: listedDatabase === undefined,
    table: listedTable
      ? { kind: 'existing', name: listedTable.name, columns: listedTable.columns }
      : { kind: 'new', name: toIdentifier(tableName), displayName: tableName }
  };
}

function newNameError(name: string, label: string): string | undefined {
  if (name.replace(/_/g, '') === '') return `${label} name needs a letter or a digit`;
  return /^\d/.test(name) ? `${label} name can't start with a digit` : undefined;
}

/** Errors to show on the fields; an existing table must have the file's columns (`tableMismatch`). */
export function destinationErrors(
  destination: CsvDestination,
  columns: readonly CsvColumn[]
): Partial<Record<keyof CsvDestinationValues, string>> {
  const { table } = destination;
  const databaseName = destination.isNewDatabase ? newNameError(destination.dbName, 'Database') : undefined;
  const tableName = table.kind === 'new' ? newNameError(table.name, 'Table') : tableMismatch(columns, table.columns);
  return Object.fromEntries(Object.entries({ databaseName, tableName }).filter(([, message]) => message !== undefined));
}

/** What a typed name becomes, under the field. */
export function destinationHint(destination: CsvDestination, field: keyof CsvDestinationValues): string | undefined {
  if (field === 'databaseName') return destination.isNewDatabase ? `New database: ${destination.dbName}` : undefined;
  return destination.table.kind === 'new'
    ? `New table: ${destination.table.name}`
    : 'The rows are added to this table.';
}
