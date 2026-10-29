import dayjs from 'dayjs';
import type { DatabaseEntry } from '@/core/schema/DatabaseService';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

/** Page sizes of the listing, paged in the browser: `databases/my_data` always answers with every database. */
export const DATABASE_PAGE_SIZES: readonly number[] = [20, 50, 100];

/** v1's search: the display name contains the text, ignoring case. v2 also matches the name. */
export function filterDatabaseEntries(entries: readonly DatabaseEntry[], text: string): DatabaseEntry[] {
  const search = text.trim().toLowerCase();
  if (!search) return [...entries];
  return entries.filter(entry => entry.displayName.toLowerCase().includes(search) || entry.name.toLowerCase().includes(search));
}

/** v1 `UserAvatarCell`: the owner's name, else the creator's id; databases already in the warehouse have neither. */
export function ownerName(entry: DatabaseEntry): string {
  return entry.owner?.displayName || entry.creatorId || 'Unknown';
}

/** v1's Created Time (`MMM DD, YYYY hh:mm A`), in the browser's time zone; `--` when unknown. */
export function formatCreatedTime(epochMillis: number): string {
  return epochMillis > 0 ? dayjs(epochMillis).format('MMM DD, YYYY hh:mm A') : '--';
}

/** Column sorters, for antd `Table` (`sorter`). v1 listed by display name and sorted nothing else. */
export const compareDatabases = {
  name: (a: DatabaseEntry, b: DatabaseEntry) => a.displayName.localeCompare(b.displayName),
  owner: (a: DatabaseEntry, b: DatabaseEntry) => ownerName(a).localeCompare(ownerName(b)),
  createdTime: (a: DatabaseEntry, b: DatabaseEntry) => a.createdTime - b.createdTime
};

/** Where a row leads: the database on the Schema page (v1 `DataSchema` `?database=`). */
export function schemaPathOf(dbName: string): string {
  return `${getWarehouseSection(WarehouseSection.Schema).path}?${new URLSearchParams({ database: dbName })}`;
}

/** v1's confirm. The server has no trash (`DATA_WAREHOUSE.md`, DW0), so the delete is permanent. */
export function deleteDatabaseText(entry: Pick<DatabaseEntry, 'displayName'>): string {
  return `Are you sure you want to permanently delete database '${entry.displayName}'?`;
}
