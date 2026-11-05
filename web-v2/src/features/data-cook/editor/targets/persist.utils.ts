import { PersistType, type PersistConfiguration } from '@/core/data-cook/EtlOperator';

/**
 * Save To Data Warehouse (v1 `SaveToDataWareHouse` + `SelectDatabaseAndTable`): a table of the warehouse the operator's
 * table is written to on each run, replacing it (Update) or adding to it (Append). A database or table that doesn't
 * exist yet is created by the run (checked on the server, DC9); v1 created a new database as soon as the dialog closed.
 */

export interface PersistForm {
  /** A database's name, or one to create. */
  readonly database: string;
  readonly table: string;
  readonly type: PersistType;
}

export const PERSIST_TYPES: readonly PersistType[] = [PersistType.Update, PersistType.Append];

export function persistFormOf(persist: PersistConfiguration | undefined): PersistForm {
  return persist ? { database: persist.dbName, table: persist.tblName, type: persist.type } : { database: '', table: '', type: PersistType.Update };
}

/** v1 `makeNameFromDisplayName`: a new database's or table's name, lowercase, other characters as `_`. */
export function targetNameOf(text: string): string {
  return text.trim().toLowerCase().replace(/\W/g, '_');
}

/** A name picked from `existing` as it is, a new one as `targetNameOf` makes it. */
export function resolvedName(text: string, existing: readonly string[]): string {
  const trimmed = text.trim();
  return existing.includes(trimmed) ? trimmed : targetNameOf(trimmed);
}

export type PersistCheck =
  | { readonly ok: true; readonly persist: PersistConfiguration }
  | { readonly ok: false; readonly databaseError: string | undefined; readonly tableError: string | undefined };

function nameError(name: string, what: 'Database' | 'Table'): string | undefined {
  if (name === '') return `Please select or input a ${what.toLowerCase()} name.`;
  if (/^\d/.test(name)) return `${what} name can't start with a digit`;
  return undefined;
}

/** v1's checks on Add: a database and a table, neither starting with a digit. */
export function checkPersist(form: PersistForm, databases: readonly string[], tables: readonly string[]): PersistCheck {
  const dbName = resolvedName(form.database, databases);
  const tblName = resolvedName(form.table, tables);
  const databaseError = nameError(dbName, 'Database');
  const tableError = nameError(tblName, 'Table');
  if (databaseError || tableError) return { ok: false, databaseError, tableError };
  return { ok: true, persist: { dbName, tblName, type: form.type } };
}

/** What the dialog says under the database and table it will write (v1's warning on Update). */
export function persistHint(form: PersistForm, databases: readonly string[], tables: readonly string[]): string | undefined {
  const dbName = resolvedName(form.database, databases);
  const tblName = resolvedName(form.table, tables);
  const created = [dbName !== '' && !databases.includes(dbName) && 'database', tblName !== '' && !tables.includes(tblName) && 'table'].filter(Boolean);
  if (created.length > 0) return `The ${created.join(' and ')} will be created on the first run`;
  if (form.type === PersistType.Update && tblName !== '') return `This action will overwrite the data and schema of the table: ${tblName}`;
  return undefined;
}
