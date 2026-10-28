import type { Key } from 'react';
import { JdbcDatabaseType, type DataSource, type SourceId } from '@/core/ingestion/DataSource';
import { SourceSortField, type SourceInfo } from '@/core/ingestion/DataSourceService';
import { SortOrder, type Sort } from '@/core/listing/Listing';
import type { ListingState } from '../listing/listing.utils';

/** v1 `DataSourceScreen`: newest first. */
export const DEFAULT_SOURCE_SORT: Sort<SourceSortField> = { field: SourceSortField.LastModified, order: SortOrder.Desc };

/** v1's `SearchInput` `timeBound`. */

/** Columns of the listing, in v1's order (Action comes with DI3b). */
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

const JDBC_TYPE_LABELS: Readonly<Record<JdbcDatabaseType, string>> = {
  [JdbcDatabaseType.MySql]: 'MySQL',
  [JdbcDatabaseType.SqlServer]: 'Microsoft SQL',
  [JdbcDatabaseType.Oracle]: 'Oracle',
  [JdbcDatabaseType.Redshift]: 'Redshift',
  [JdbcDatabaseType.Postgres]: 'PostgreSQL',
  [JdbcDatabaseType.GenericJdbc]: 'Generic JDBC'
};

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
  if (source.kind === 'jdbc') return JDBC_TYPE_LABELS[source.databaseType];
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
