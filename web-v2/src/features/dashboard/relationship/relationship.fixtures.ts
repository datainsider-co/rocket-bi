import { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import type { RelationshipService } from '@/core/relationship/RelationshipService';
import { databaseSchemaFromJson, tableSchemaFromJson, type SchemaService } from '@/core/schema/SchemaService';

/**
 * Data for stories and tests, shaped like the local backend's replies for dashboard 1 ("v2 Sample"): the
 * `sample_v2.sales` table and two SQL views over it, positions saved under v1's keys.
 */
const SALES_VIEW = { class_name: 'table_view', db_name: 'sample_v2', tbl_name: 'sales', alias_name: 'tbl_4d03e2' };
const ORDERS_QUERY = 'select order_id, order_date, ship_date, order_priority, sales_channel from sample_v2.sales';
const REGIONS_QUERY = 'select region, country, count(*) as order_count from sample_v2.sales group by region, country';
const ORDERS_VIEW = { class_name: 'sql_view', alias_name: 'orders', query: { class_name: 'sql_query', query: ORDERS_QUERY } };
const REGIONS_VIEW = {
  class_name: 'sql_view',
  alias_name: 'regions',
  query: { class_name: 'sql_query', query: REGIONS_QUERY }
};

const salesField = (field_name: string, field_type: string) => ({
  class_name: 'table_field',
  db_name: 'sample_v2',
  tbl_name: 'sales',
  field_name,
  field_type
});
const viewField = (view_name: string, field_name: string, field_type: string) => ({
  class_name: 'view_field',
  view_name,
  field_name,
  field_type
});

export const RELATIONSHIP_JSON = {
  views: [SALES_VIEW, ORDERS_VIEW, REGIONS_VIEW],
  relationships: [
    {
      first_view: SALES_VIEW,
      second_view: ORDERS_VIEW,
      field_pairs: [
        { first_field: salesField('order_id', 'int64'), second_field: viewField('orders', 'order_id', 'int64') }
      ]
    },
    {
      first_view: SALES_VIEW,
      second_view: REGIONS_VIEW,
      field_pairs: [
        { first_field: salesField('region', 'string'), second_field: viewField('regions', 'region', 'string') },
        { first_field: salesField('country', 'string'), second_field: viewField('regions', 'country', 'string') }
      ]
    }
  ],
  extra_data: {
    table_positions: {
      sampleV2Sales: { left: 360, top: 40 },
      adhocAnalysisorders: { left: 0, top: 0 },
      adhocAnalysisregions: { left: 720, top: 120 }
    }
  }
};

const column = (name: string, class_name: string) => ({ class_name, name, display_name: name });

const SALES_COLUMNS = [
  column('region', 'string'),
  column('country', 'string'),
  column('item_type', 'string'),
  column('sales_channel', 'string'),
  column('order_priority', 'string'),
  column('order_date', 'datetime'),
  column('order_id', 'int64'),
  column('ship_date', 'datetime'),
  column('units_sold', 'int32'),
  column('unit_price', 'double'),
  column('unit_cost', 'double'),
  column('total_revenue', 'double'),
  column('total_cost', 'double'),
  column('total_profit', 'double')
];

export const SAMPLE_DATABASE_JSON = {
  name: 'sample_v2',
  display_name: 'sample_v2',
  tables: [{ name: 'sales', db_name: 'sample_v2', display_name: 'sales', columns: SALES_COLUMNS }]
};

const ADHOC_COLUMNS: Record<string, ReturnType<typeof column>[]> = {
  [ORDERS_QUERY]: [
    column('order_id', 'int64'),
    column('order_date', 'datetime'),
    column('ship_date', 'datetime'),
    column('order_priority', 'string'),
    column('sales_channel', 'string')
  ],
  [REGIONS_QUERY]: [column('region', 'string'), column('country', 'string'), column('order_count', 'uint64')]
};

/** A relationship service holding one dashboard's relationships in memory; saves replace them. */
export function fixtureRelationshipService(json: unknown = RELATIONSHIP_JSON): RelationshipService {
  let stored = new RelationshipInfo(json);
  return {
    getDashboardRelationship: async () => new RelationshipInfo(stored.toJson()),
    saveDashboardRelationship: async (_dashboardId, info) => {
      stored = new RelationshipInfo(info.toJson());
    },
    getGlobalRelationship: async () => new RelationshipInfo(),
    saveGlobalRelationship: async () => {}
  };
}

/** A schema service that knows `sample_v2` and the fixture's SQL views. */
export function fixtureSchemaService(): SchemaService {
  return {
    getDatabase: async dbName =>
      databaseSchemaFromJson(dbName === SAMPLE_DATABASE_JSON.name ? SAMPLE_DATABASE_JSON : { name: dbName }),
    detectTableSchema: async query =>
      tableSchemaFromJson({ name: 'adhoc_view', db_name: '', columns: ADHOC_COLUMNS[query] ?? [] })
  };
}
