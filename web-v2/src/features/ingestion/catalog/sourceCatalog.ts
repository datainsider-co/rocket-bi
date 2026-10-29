import { JdbcDatabaseType } from '@/core/ingestion/DataSource';
import { JDBC_SOURCE_KINDS } from '../sourceKinds';

/**
 * The source types the "Add Data Source" catalog lists, in v1's order (`ALL_DATASOURCE`). Google Analytics (Universal
 * Analytics, shut down by Google) and the SDK trackers v1 had commented out are left out.
 *
 * An entry is `available` when v2 has a form for it; `form` then says which one, so the caller can open it without
 * matching on `key`. The other types are listed as `coming-soon` and can't be picked.
 */

/** Which form an available entry opens: the JDBC source form for one `database_type`, or the CSV import wizard. */
export type SourceForm = { readonly kind: 'jdbc'; readonly databaseType: JdbcDatabaseType } | { readonly kind: 'csv' };

export type SourceCatalogKey =
  | 'generic_jdbc'
  | 'mysql'
  | 'oracle'
  | 'sql_server'
  | 'mongodb'
  | 'redshift'
  | 'bigquery'
  | 'postgresql'
  | 'ga4'
  | 'google_ads'
  | 'google_search_console'
  | 'csv'
  | 'google_sheets'
  | 'shopify'
  | 's3'
  | 'facebook_ads'
  | 'tiktok_ads'
  | 'palexy'
  | 'hubspot'
  | 'mixpanel';

interface SourceCatalogEntryBase {
  readonly key: SourceCatalogKey;
  readonly title: string;
  /** Card image (118 × 80) from v1, under `public/ingestion/sources/`. */
  readonly iconUrl: string;
}

export interface AvailableSourceEntry extends SourceCatalogEntryBase {
  readonly status: 'available';
  readonly form: SourceForm;
}

export interface ComingSoonSourceEntry extends SourceCatalogEntryBase {
  readonly status: 'coming-soon';
}

export type SourceCatalogEntry = AvailableSourceEntry | ComingSoonSourceEntry;

const ICON_DIR = '/ingestion/sources';

/** Title and image come from the source kind, so the listing and the form name the type the same way. */
function jdbc(key: SourceCatalogKey, databaseType: JdbcDatabaseType): AvailableSourceEntry {
  const { label, iconUrl } = JDBC_SOURCE_KINDS[databaseType];
  return { key, title: label, iconUrl, status: 'available', form: { kind: 'jdbc', databaseType } };
}

function comingSoon(key: SourceCatalogKey, title: string, icon: string): ComingSoonSourceEntry {
  return { key, title, iconUrl: `${ICON_DIR}/${icon}`, status: 'coming-soon' };
}

export const SOURCE_CATALOG: readonly SourceCatalogEntry[] = [
  jdbc('generic_jdbc', JdbcDatabaseType.GenericJdbc),
  jdbc('mysql', JdbcDatabaseType.MySql),
  jdbc('oracle', JdbcDatabaseType.Oracle),
  jdbc('sql_server', JdbcDatabaseType.SqlServer),
  comingSoon('mongodb', 'MongoDB', 'ic_mongo.png'),
  jdbc('redshift', JdbcDatabaseType.Redshift),
  comingSoon('bigquery', 'BigQuery', 'ic_big_query.png'),
  jdbc('postgresql', JdbcDatabaseType.Postgres),
  comingSoon('ga4', 'Google Analytics 4', 'ic_ga_4.png'),
  comingSoon('google_ads', 'Google Ads', 'ic_gg_ads.png'),
  comingSoon('google_search_console', 'Google Search Console', 'ic_google_search_console.png'),
  { key: 'csv', title: 'CSV', iconUrl: `${ICON_DIR}/ic_csv.png`, status: 'available', form: { kind: 'csv' } },
  comingSoon('google_sheets', 'Google Sheets', 'ic_google_sheet.png'),
  comingSoon('shopify', 'Shopify', 'ic_shopify.png'),
  comingSoon('s3', 'S3', 'ic_s3.png'),
  comingSoon('facebook_ads', 'Facebook Ads', 'ic_fb_ads.png'),
  comingSoon('tiktok_ads', 'TikTok Ads', 'ic_tiktok_ads.png'),
  comingSoon('palexy', 'Palexy', 'ic_palexy.png'),
  comingSoon('hubspot', 'Hubspot', 'ic_hubspot.svg'),
  comingSoon('mixpanel', 'Mixpanel', 'ic_mixpanel.svg')
];

export function isAvailableSource(entry: SourceCatalogEntry): entry is AvailableSourceEntry {
  return entry.status === 'available';
}
