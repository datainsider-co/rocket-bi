/** Pages of the Data Warehouse, at v1's paths (`Router.ts`). Data Cook is under the same menu but is Phase 7. */
export const WarehouseSection = {
  Databases: 'databases',
  Schema: 'schema',
  QueryEditor: 'query-editor',
  Relationship: 'relationship'
} as const;

export type WarehouseSection = (typeof WarehouseSection)[keyof typeof WarehouseSection];

export const WAREHOUSE_PATH = '/data-warehouse';

/** The database listing. v1 also had `/databases/trash`, but the server has no trash (`DATA_WAREHOUSE.md`, DW0). */
export const DATABASES_PATH = `${WAREHOUSE_PATH}/databases/all`;

export interface WarehouseSectionConfig {
  readonly key: WarehouseSection;
  /** Page title, as v1's header showed it. */
  readonly title: string;
  /** v1 icon font class. */
  readonly icon: string;
  readonly path: string;
}

const SECTIONS: Readonly<Record<WarehouseSection, WarehouseSectionConfig>> = {
  [WarehouseSection.Databases]: { key: WarehouseSection.Databases, title: 'All Databases', icon: 'di-icon-database', path: DATABASES_PATH },
  [WarehouseSection.Schema]: { key: WarehouseSection.Schema, title: 'Schema', icon: 'di-icon-schema', path: `${WAREHOUSE_PATH}/schema` },
  [WarehouseSection.QueryEditor]: {
    key: WarehouseSection.QueryEditor,
    title: 'Query Analysis',
    icon: 'di-icon-query-editor',
    path: `${WAREHOUSE_PATH}/query-editor`
  },
  [WarehouseSection.Relationship]: {
    key: WarehouseSection.Relationship,
    title: 'Relationship',
    icon: 'di-icon-relationship',
    path: `${WAREHOUSE_PATH}/relationship`
  }
};

export function getWarehouseSection(key: WarehouseSection): WarehouseSectionConfig {
  return SECTIONS[key];
}

export type PageLocation = { readonly pathname: string; readonly search: string };

/** Whether a navigation leaves what the page shows; one to the same URL (a re-render of the link) doesn't. */
export function leavesPage(current: PageLocation, next: PageLocation): boolean {
  return current.pathname !== next.pathname || current.search !== next.search;
}
