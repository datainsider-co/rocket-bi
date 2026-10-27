import { describe, expect, it } from 'vitest';
import { TableField, ViewField, parseField } from './Field';
import { SqlQuery, SqlView, TableView, parseQueryView } from './QueryView';
import { FieldPair, Relationship } from './Relationship';
import { RelationshipInfo } from './RelationshipInfo';

const SALES = { class_name: 'table_view', db_name: 'sample_v2', tbl_name: 'sales', alias_name: 'tbl_4d03e2' };
const ORDERS_QUERY = 'select order_id, order_date from sample_v2.sales';
/** As the local backend returns it: it adds the derived query fields. */
const ORDERS = {
  class_name: 'sql_view',
  alias_name: 'orders',
  query: {
    class_name: 'sql_query',
    query: ORDERS_QUERY,
    rls_conditions: [],
    expressions: {},
    parameters: {},
    all_query_views: [SALES]
  }
};
const SALES_ORDER_ID = {
  class_name: 'table_field',
  db_name: 'sample_v2',
  tbl_name: 'sales',
  field_name: 'order_id',
  field_type: 'int64'
};
const ORDERS_ORDER_ID = { class_name: 'view_field', view_name: 'orders', field_name: 'order_id', field_type: 'int64' };

/** Trimmed `GET relationships/1` reply from the local backend, positions written by v1. */
const REPLY = {
  views: [SALES, ORDERS],
  relationships: [
    { first_view: SALES, second_view: ORDERS, field_pairs: [{ first_field: SALES_ORDER_ID, second_field: ORDERS_ORDER_ID }] }
  ],
  extra_data: { table_positions: { sampleV2Sales: { left: 360, top: 40 }, adhocAnalysisorders: { left: 0, top: 0 } } }
};

describe('parseQueryView', () => {
  it('reads a table view', () => {
    const view = parseQueryView(SALES);
    expect(view).toBeInstanceOf(TableView);
    expect(view).toMatchObject({ dbName: 'sample_v2', tblName: 'sales', aliasName: 'tbl_4d03e2' });
  });

  it('reads a SQL view and keeps only the query text', () => {
    const view = parseQueryView(ORDERS);
    expect(view).toBeInstanceOf(SqlView);
    expect(view?.toJson()).toEqual({
      class_name: 'sql_view',
      alias_name: 'orders',
      query: { class_name: 'sql_query', query: ORDERS_QUERY }
    });
  });

  it.each([null, undefined, {}, { class_name: 'other_view' }])('ignores %j', json => {
    expect(parseQueryView(json)).toBeUndefined();
  });
});

describe('SqlQuery', () => {
  it('sends encrypt_key only when set', () => {
    expect(new SqlQuery({ query: 'q', encrypt_key: 'k' }).toJson()).toEqual({
      class_name: 'sql_query',
      query: 'q',
      encrypt_key: 'k'
    });
  });
});

describe('parseField', () => {
  it('reads a table field', () => {
    const field = parseField(SALES_ORDER_ID);
    expect(field).toBeInstanceOf(TableField);
    expect(field?.toJson()).toEqual(SALES_ORDER_ID);
  });

  it('reads a view field', () => {
    const field = parseField(ORDERS_ORDER_ID);
    expect(field).toBeInstanceOf(ViewField);
    expect(field?.toJson()).toEqual(ORDERS_ORDER_ID);
  });

  it.each([null, { class_name: 'expression_field' }])('ignores %j', json => {
    expect(parseField(json)).toBeUndefined();
  });
});

describe('RelationshipInfo', () => {
  it('reads views, relationships and positions', () => {
    const info = new RelationshipInfo(REPLY);

    expect(info.views).toHaveLength(2);
    expect(info.relationships[0]?.firstView).toBeInstanceOf(TableView);
    expect(info.relationships[0]?.secondView).toBeInstanceOf(SqlView);
    expect(info.relationships[0]?.fieldPairs[0]?.secondField).toMatchObject({ viewName: 'orders', fieldName: 'order_id' });
    expect(info.tablePositions).toEqual({ sampleV2Sales: { left: 360, top: 40 }, adhocAnalysisorders: { left: 0, top: 0 } });
  });

  it('keeps position keys exactly as stored', () => {
    const info = new RelationshipInfo({ extra_data: { table_positions: { 'db.Some Table': { left: 1, top: 2 } } } });
    expect(Object.keys(info.tablePositions)).toEqual(['db.Some Table']);
    expect(Object.keys((info.toJson().extra_data as { table_positions: object }).table_positions)).toEqual([
      'db.Some Table'
    ]);
  });

  it('reads the empty reply of a dashboard without relationships', () => {
    const info = new RelationshipInfo({ views: [], relationships: [], extra_data: {} });
    expect(info).toMatchObject({ views: [], relationships: [], tablePositions: {} });
  });

  it.each([null, undefined, 'x'])('accepts %j', json => {
    expect(new RelationshipInfo(json)).toMatchObject({ views: [], relationships: [], tablePositions: {} });
  });

  it('drops unknown views and relationships that use one', () => {
    const unknown = { class_name: 'other_view' };
    const info = new RelationshipInfo({
      views: [SALES, unknown],
      relationships: [{ first_view: SALES, second_view: unknown, field_pairs: [] }]
    });
    expect(info.views).toHaveLength(1);
    expect(info.relationships).toEqual([]);
  });

  it('falls back to 0 for invalid coordinates', () => {
    const info = new RelationshipInfo({ extra_data: { table_positions: { a: { left: 'x' } } } });
    expect(info.tablePositions).toEqual({ a: { left: 0, top: 0 } });
  });

  it('writes the body the backend accepts', () => {
    expect(new RelationshipInfo(REPLY).toJson()).toEqual({
      views: [SALES, { class_name: 'sql_view', alias_name: 'orders', query: { class_name: 'sql_query', query: ORDERS_QUERY } }],
      relationships: [
        {
          first_view: SALES,
          second_view: { class_name: 'sql_view', alias_name: 'orders', query: { class_name: 'sql_query', query: ORDERS_QUERY } },
          field_pairs: [{ first_field: SALES_ORDER_ID, second_field: ORDERS_ORDER_ID }]
        }
      ],
      extra_data: { table_positions: { sampleV2Sales: { left: 360, top: 40 }, adhocAnalysisorders: { left: 0, top: 0 } } }
    });
  });

  it('builds one from values', () => {
    const sales = new TableView(SALES);
    const orders = new SqlView(ORDERS);
    const pair = FieldPair.of(new TableField(SALES_ORDER_ID), new ViewField(ORDERS_ORDER_ID));
    const info = RelationshipInfo.of([sales, orders], [Relationship.of(sales, orders, [pair])], { k: { left: 1, top: 2 } });

    expect(new RelationshipInfo(info.toJson()).toJson()).toEqual(info.toJson());
  });
});
