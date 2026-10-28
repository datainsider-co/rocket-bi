import type { CatalogKey, FunctionCatalog } from './functionCatalog.utils';

/** Each catalogue is its own chunk, loaded when a formula editor opens. */
const LOADERS: Readonly<Record<CatalogKey, () => Promise<{ default: unknown }>>> = {
  bigquery: () => import('./catalogues/bigquery.json'),
  clickhouse: () => import('./catalogues/clickhouse.json'),
  mysql: () => import('./catalogues/mysql.json'),
  postgresql: () => import('./catalogues/postgresql.json'),
  redshift: () => import('./catalogues/redshift.json'),
  vertica: () => import('./catalogues/vertica.json')
};

export async function loadFunctionCatalog(key: CatalogKey): Promise<FunctionCatalog> {
  return (await LOADERS[key]()).default as FunctionCatalog;
}
