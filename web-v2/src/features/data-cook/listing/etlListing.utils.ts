import dayjs, { type Dayjs } from 'dayjs';
import { canCancelEtl, hasNextExecution, type EtlJob } from '@/core/data-cook/EtlJob';
import { EtlSortField, type EtlListing } from '@/core/data-cook/EtlService';
import { SortOrder, type Sort } from '@/core/listing/Listing';
import { formatDateTime } from '@/shared/listing/listing.utils';
import { DataCookSection } from '../dataCook.utils';

/** v1 sent no sort (the server's order, oldest first); v2 shows the newest ETL first, with the arrow on Created Time. */
export const DEFAULT_ETL_SORT: Sort<EtlSortField> = { field: EtlSortField.CreatedTime, order: SortOrder.Desc };

export const ETL_SEARCH_PLACEHOLDER = 'Search ETL name';

const NO_VALUE = '--';

/** The listing a section shows (v1 `ListEtlJob` `type`). */
export function etlListingOf(section: DataCookSection): EtlListing {
  if (section === DataCookSection.Shared) return 'shared';
  if (section === DataCookSection.Trash) return 'trash';
  return 'mine';
}

const SORT_FIELDS: readonly string[] = Object.values(EtlSortField);

/** The sort field of a clicked column (its antd `columnKey`), if the server can sort by it. */
export function toEtlSortField(columnKey: unknown): EtlSortField | undefined {
  return typeof columnKey === 'string' && SORT_FIELDS.includes(columnKey) ? (columnKey as EtlSortField) : undefined;
}

/** v1 `UserAvatarCell` on `owner`: the owner's name, or the id when the server sent no profile. */
export function etlOwnerName(etl: Pick<EtlJob, 'owner' | 'ownerId'>): string {
  return etl.owner?.displayName || etl.ownerId || 'Unknown';
}

/** v1 "Next Run": `--` when the ETL won't run again, and always in the trash (trashed ETLs don't run). */
export function nextRunLabel(etl: EtlJob, listing: EtlListing): string {
  return listing !== 'trash' && hasNextExecution(etl) ? formatDateTime(etl.nextExecuteTime) : NO_VALUE;
}

/** What an empty listing says (v1 `LayoutNoData` of `ListEtlJob`). */
export function emptyEtlText(listing: EtlListing, keyword: string): string {
  const trimmed = keyword.trim();
  if (trimmed) return `No ETL matches "${trimmed}"`;
  if (listing === 'mine') return 'Add your first ETL';
  if (listing === 'trash') return 'The trash is empty';
  return "You don't have any ETL yet";
}

/** How often the listing reloads by itself while an ETL is running or due, so its status moves on; never otherwise. */
export const RUNNING_POLL_MS = 5_000;

/**
 * Whether `etl` is running or about to: cancellable, or past its next run (a forced run is `Initialized` until the
 * scheduler picks it up).
 */
export function isRunActive(etl: EtlJob, now: number): boolean {
  return canCancelEtl(etl) || (hasNextExecution(etl) && etl.nextExecuteTime <= now);
}

/** TanStack Query `refetchInterval` of a listing page: poll while one of its ETLs runs. */
export function etlRefetchInterval(etls: readonly EtlJob[] | undefined, now: number): number | false {
  return etls?.some(etl => isRunActive(etl, now)) ? RUNNING_POLL_MS : false;
}

export function trashEtlText(etl: Pick<EtlJob, 'displayName'>): string {
  return `Are you sure to delete '${etl.displayName}'? It goes to the trash, where it can be restored.`;
}

export function deleteForeverText(etl: Pick<EtlJob, 'displayName'>): string {
  return `Are you sure to delete '${etl.displayName}' forever? This can't be undone.`;
}

export function restoreEtlText(etl: Pick<EtlJob, 'displayName'>): string {
  return `Are you sure to restore '${etl.displayName}'?`;
}

/**
 * When a forced run on `day` starts (v1 `ForceRunSettingModal`): now for today, as v1's default, else the start of
 * that day. The server runs the ETL at that time (it becomes `next_execute_time`).
 */
export function forceRunTime(day: Dayjs, now: number): number {
  return day.isSame(dayjs(now), 'day') ? now : day.startOf('day').valueOf();
}

/** A day before today; the calendar disables them (a run there would just start now). */
export function isPastDay(day: Dayjs, now: number): boolean {
  return day.isBefore(dayjs(now), 'day');
}

export function forceRunMessage(atTime: number, now: number): string {
  return atTime <= now ? 'The ETL will run now' : `The ETL will run at ${formatDateTime(atTime)}`;
}
