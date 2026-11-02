import { parseIdParam, toIdParam } from '@/shared/routing/idParam';

/** Pages of Data Cook, keyed by their path segment under `/data-warehouse/data-cook` (v1 `Router.ts`). */
export const DataCookSection = {
  MyEtl: 'my-etl',
  Shared: 'shared',
  History: 'history',
  Trash: 'trash'
} as const;

export type DataCookSection = (typeof DataCookSection)[keyof typeof DataCookSection];

export const DATA_COOK_PATH = '/data-warehouse/data-cook';

/** v1 "New ETL": the editor on an ETL that doesn't exist yet. */
export const NEW_ETL_PATH = `${DATA_COOK_PATH}/my-etl/create`;

export interface DataCookSectionConfig {
  readonly key: DataCookSection;
  /** Page title and sidebar label, as in v1. */
  readonly title: string;
  /** v1 icon font class. */
  readonly icon: string;
  readonly path: string;
}

/** The sidebar of v1 `DataCook.vue`. */
export const DATA_COOK_SECTIONS: readonly DataCookSectionConfig[] = [
  { key: DataCookSection.MyEtl, title: 'My ETL', icon: 'di-icon-etl-home', path: `${DATA_COOK_PATH}/my-etl` },
  { key: DataCookSection.Shared, title: 'Share With Me', icon: 'di-icon-share-with-me', path: `${DATA_COOK_PATH}/shared` },
  { key: DataCookSection.History, title: 'ETL History', icon: 'di-icon-restore', path: `${DATA_COOK_PATH}/history` },
  { key: DataCookSection.Trash, title: 'Trash', icon: 'di-icon-delete', path: `${DATA_COOK_PATH}/trash` }
];

export function getDataCookSection(key: DataCookSection): DataCookSectionConfig {
  const section = DATA_COOK_SECTIONS.find(item => item.key === key);
  if (!section) throw new Error(`Unknown Data Cook section: ${key}`);
  return section;
}

/**
 * The section `pathname` is in (`/data-warehouse/data-cook/<section>/...`). The editor (`my-etl/...`) is in My ETL,
 * like in v1; anything else defaults to My ETL, where `/data-warehouse/data-cook` goes.
 */
export function dataCookSectionFromPath(pathname: string): DataCookSection {
  if (!pathname.startsWith(`${DATA_COOK_PATH}/`)) return DataCookSection.MyEtl;
  const segment = pathname.slice(DATA_COOK_PATH.length + 1).split('/')[0];
  return DATA_COOK_SECTIONS.find(section => section.key === segment)?.key ?? DataCookSection.MyEtl;
}

/** The editor of an ETL, `my-etl/<slug>-<id>` (v1 `Routers.UpdateEtl`). */
export function etlEditorPath(id: number, displayName: string): string {
  return `${DATA_COOK_PATH}/my-etl/${toIdParam(id, displayName)}`;
}

/** The ETL id in the editor's `:name` segment, or `undefined` when there is none. */
export function etlIdFromParam(param: string | undefined): number | undefined {
  return parseIdParam(param);
}
