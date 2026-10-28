import type { Key } from 'react';
import type { DataSource, JdbcSource, SourceId } from '@/core/ingestion/DataSource';
import { SourceSortField, type SourceInfo } from '@/core/ingestion/DataSourceService';
import { SortOrder, type Sort } from '@/core/listing/Listing';
import type { JobFormTarget } from '../job-form/jobForm.utils';
import { countLabel, type ListingState } from '../listing/listing.utils';
import type { SourceFormTarget } from '../source-form/sourceForm.utils';
import { JDBC_SOURCE_KINDS } from '../sourceKinds';

/** v1 `DataSourceScreen`: newest first. */
export const DEFAULT_SOURCE_SORT: Sort<SourceSortField> = { field: SourceSortField.LastModified, order: SortOrder.Desc };

/** Columns of the listing, in v1's order; the Action column sorts by nothing and has its own key. */
export const SourceColumn = {
  Name: 'name',
  Owner: 'owner',
  Type: 'type',
  LastModified: 'lastModified'
} as const;

export type SourceColumn = (typeof SourceColumn)[keyof typeof SourceColumn];

/** The backend column each listing column sorts by. All four are in the `source/list` whitelist (DI0). */
const COLUMN_SORT_FIELDS: Readonly<Record<SourceColumn, SourceSortField>> = {
  [SourceColumn.Name]: SourceSortField.Name,
  [SourceColumn.Owner]: SourceSortField.Creator,
  [SourceColumn.Type]: SourceSortField.Type,
  [SourceColumn.LastModified]: SourceSortField.LastModified
};

/** The sort field of a clicked column; `undefined` for a column that doesn't sort (or an unknown key). */
export function sortFieldOfColumn(columnKey: Key | undefined): SourceSortField | undefined {
  if (typeof columnKey !== 'string' || !Object.hasOwn(COLUMN_SORT_FIELDS, columnKey)) return undefined;
  return COLUMN_SORT_FIELDS[columnKey as SourceColumn];
}

/** `class_name` of the source types v2 can't edit yet (v1 `DataSources`), with v1's catalog titles. */
const UNSUPPORTED_TYPE_LABELS: ReadonlyMap<string, string> = new Map([
  ['mongo_db_source', 'MongoDB'],
  ['gg_service_account_source', 'BigQuery'],
  ['google_token_credential_source', 'Google Sheets'],
  ['google_ads_source', 'Google Ads'],
  ['ga_source', 'Google Analytics'],
  ['ga4_source', 'Google Analytics 4'],
  ['google_search_console_source', 'Google Search Console'],
  ['shopify_source', 'Shopify'],
  ['amazon_s3', 'S3'],
  ['facebook_ads_source', 'Facebook Ads'],
  ['tik_tok_ads_source', 'TikTok Ads'],
  ['palexy_source', 'Palexy'],
  ['hubspot_source', 'Hubspot'],
  ['mixpanel_source', 'Mixpanel']
]);

/** The Type cell. v1 showed the raw `sourceType` (`SqlServer`, `Postgres`); this is the catalog's name. */
export function sourceTypeLabel(source: DataSource): string {
  if (source.kind === 'jdbc') return JDBC_SOURCE_KINDS[source.databaseType].label;
  return UNSUPPORTED_TYPE_LABELS.get(source.className) ?? (source.className || 'Unknown');
}

/** The Owner cell: the creator's name (v1 `UserAvatarCell` order), else the `creator_id` the source has. */
export function ownerName({ source, creator }: SourceInfo): string {
  return creator?.displayName || source.creatorId || 'Unknown';
}

export function sourceRowKey(info: SourceInfo): SourceId {
  return info.source.id;
}

/**
 * What the page body shows. A failed load shows the error; with no result yet, or while the previous page stands in
 * for the next one, the table shows its spinner; an empty result shows "no data" or, when searching, "no match".
 */
export type SourcesBody = 'error' | 'table' | 'empty' | 'no-match';

export interface SourcesBodyInput {
  readonly hasError: boolean;
  /** `undefined` before the first page arrives. */
  readonly total: number | undefined;
  readonly isPlaceholder: boolean;
  readonly keyword: string;
}

export function sourcesBody({ hasError, total, isPlaceholder, keyword }: SourcesBodyInput): SourcesBody {
  if (hasError) return 'error';
  if (total === undefined || isPlaceholder || total > 0) return 'table';
  return keyword.trim() ? 'no-match' : 'empty';
}

/** What the listing view renders. */
export interface DataSourcesListing {
  readonly state: ListingState<SourceSortField>;
  readonly body: SourcesBody;
  readonly rows: readonly SourceInfo[];
  readonly total: number;
  /** A page is loading: the first one, the next one or a refresh. */
  readonly isFetching: boolean;
  readonly error: string | undefined;
}

export const SOURCE_ACTION_COLUMN = 'action';

/** v2 edits JDBC sources only; others (made in v1) can be deleted but not edited or given a job. */
export function isEditableSource(source: DataSource): source is JdbcSource {
  return source.kind === 'jdbc';
}

export const NOT_EDITABLE_TEXT = 'Editing this type of data source is not supported yet';

/** v1 `handleConfirmDeleteDataSource` / `handleConfirmDeleteMultiDataSource`. */
export function deleteSourcesText(sources: readonly Pick<DataSource, 'displayName'>[]): string {
  const [only] = sources;
  if (sources.length === 1 && only) return `Are you sure to delete data source '${only.displayName}'?`;
  return `Are you sure to delete ${countLabel(sources.length, 'data source', 'data sources')}?`;
}

/** Which modal of the Data Sources page is open: the type catalog, the source form or the job form. */
export type SourcesDialog =
  | { readonly kind: 'none' }
  | { readonly kind: 'catalog' }
  | { readonly kind: 'source'; readonly target: SourceFormTarget }
  | { readonly kind: 'job'; readonly target: JobFormTarget };

export const NO_DIALOG: SourcesDialog = { kind: 'none' };

/** A new JDBC source goes on to its first job, on that source; an edit just closes. */
export function dialogAfterSourceSaved(source: DataSource, created: boolean): SourcesDialog {
  return created && isEditableSource(source) ? { kind: 'job', target: { mode: 'create', source, lockSource: true } } : NO_DIALOG;
}
