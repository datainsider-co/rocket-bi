import { EtlHistorySortField } from '@/core/data-cook/EtlHistoryService';
import { SortOrder, type Sort } from '@/core/listing/Listing';

/** v1 `EtlHistory`: the latest run first, the arrow on History Id. */
export const DEFAULT_ETL_HISTORY_SORT: Sort<EtlHistorySortField> = { field: EtlHistorySortField.Id, order: SortOrder.Desc };

/** v1 had this search hidden; the server matches `keyword` on the ETL's name. */
export const ETL_HISTORY_SEARCH_PLACEHOLDER = 'Search ETL name';

const SORT_FIELDS: readonly string[] = Object.values(EtlHistorySortField);

/** The sort field of a clicked column (its antd `columnKey`), if the server can sort by it. */
export function toEtlHistorySortField(columnKey: unknown): EtlHistorySortField | undefined {
  return typeof columnKey === 'string' && SORT_FIELDS.includes(columnKey) ? (columnKey as EtlHistorySortField) : undefined;
}

/** The lines of a run's log, without the blank ones and the trailing spaces the server leaves. */
export function logLines(message: string): string[] {
  return message
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim() !== '');
}

/**
 * The line a table cell shows: the log's last, which says how the run ended (`execute failure, ...`); v1 showed the
 * first, always `execute ELT <name>`. `--` for an empty log.
 */
export function logSummary(message: string): string {
  return logLines(message).at(-1)?.trim() ?? '--';
}

/** What an empty history says: a search that matched nothing, or no run at all (v1 `LayoutNoData`). */
export function emptyHistoryText(keyword: string): string {
  const trimmed = keyword.trim();
  return trimmed ? `No ETL run matches "${trimmed}"` : "You don't have any ETL History yet";
}
