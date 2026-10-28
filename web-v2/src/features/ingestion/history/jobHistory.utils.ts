import { JobHistorySortField } from '@/core/ingestion/JobHistoryService';
import { SortOrder, type Sort } from '@/core/listing/Listing';

/** v1 shows the latest run first: `id` DESC, with the arrow on Sync Id. */
export const DEFAULT_HISTORY_SORT: Sort<JobHistorySortField> = { field: JobHistorySortField.Id, order: SortOrder.Desc };

/** v1's search box waited 400 ms after the last key (`SearchInput :timeBound="400"`). */

const SORT_FIELDS: readonly string[] = Object.values(JobHistorySortField);

/** The sort field of a column key, or `undefined` for a column the server can't sort by (Message). */
export function toHistorySortField(columnKey: unknown): JobHistorySortField | undefined {
  return typeof columnKey === 'string' && SORT_FIELDS.includes(columnKey)
    ? (columnKey as JobHistorySortField)
    : undefined;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/**
 * A run's duration, like v1 `DateTimeUtils.formatAsHms` (`45s`, `2m 5s`, `1h 0m 3s`, hours not wrapped into days).
 * Unlike v1, a run under a second shows its milliseconds (`391ms`) instead of `0s`, since most runs are that short.
 * `--` for a negative or non-finite value.
 */
export function formatDuration(millis: number): string {
  if (!Number.isFinite(millis) || millis < 0) return '--';
  if (millis < SECOND) return `${Math.trunc(millis)}ms`;
  const hours = Math.trunc(millis / HOUR);
  const minutes = Math.trunc((millis % HOUR) / MINUTE);
  const seconds = Math.trunc((millis % MINUTE) / SECOND);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const ROW_COUNT_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Total Inserted Rows with thousands separators (`1,234,567`). v1 showed the raw number. */
export function formatRowCount(rows: number): string {
  return Number.isFinite(rows) ? ROW_COUNT_FORMAT.format(rows) : '--';
}

/** The run's error, or `--` when it has none, as v1. */
export function formatHistoryMessage(message: string): string {
  return message.trim() === '' ? '--' : message;
}

/** What the page shows in place of the table. An error wins over stale rows, as v1's error state did. */
export type HistoryContent =
  | { readonly kind: 'table' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'empty'; readonly isSearching: boolean };

export function historyContent({
  error,
  rowCount,
  isLoaded,
  keyword
}: {
  error: Error | null;
  rowCount: number;
  /** A page has arrived (the first load shows the table loading). */
  isLoaded: boolean;
  keyword: string;
}): HistoryContent {
  if (error) return { kind: 'error', message: error.message || 'Could not load the job history' };
  if (isLoaded && rowCount === 0) return { kind: 'empty', isSearching: keyword.trim() !== '' };
  return { kind: 'table' };
}
