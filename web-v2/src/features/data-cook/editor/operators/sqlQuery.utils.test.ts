import { describe, expect, it } from 'vitest';
import { etlOperatorToJson } from '@/core/data-cook/EtlOperator';
import { defaultSql, newSqlOperator, sqlLanguage, withDatabase, withoutDatabase } from './sqlQuery.utils';
import { previewTable } from './testing';

describe('withoutDatabase', () => {
  it.each([
    ['select region from preview_etl_2.sales_1', 'select region from sales_1'],
    ['select * from `preview_etl_2`.`sales_1`', 'select * from `sales_1`'],
    ['select * from preview_etl_2 . sales_1 join preview_etl_2.b', 'select * from sales_1 join b'],
    ["select 'preview_etl_2.x' from preview_etl_2.a", "select 'preview_etl_2.x' from a"],
    ['select preview_etl_22.a, x.preview_etl_2', 'select preview_etl_22.a, x.preview_etl_2'],
    ['', '']
  ])('%s', (sql, shown) => {
    expect(withoutDatabase(sql, 'preview_etl_2')).toBe(shown);
  });

  it('leaves the SQL alone without a database', () => {
    expect(withoutDatabase('select 1', '')).toBe('select 1');
  });
});

describe('withDatabase', () => {
  it.each([
    ['select region from sales_1', 'select region from preview_etl_2.sales_1'],
    ['select * from `sales_1` t', 'select * from preview_etl_2.sales_1 t'],
    ['select * from preview_etl_2.sales_1', 'select * from preview_etl_2.sales_1'],
    ['select sales_1.region from sales_1', 'select preview_etl_2.sales_1.region from preview_etl_2.sales_1'],
    ['select t.sales_1, sales_1_x from x', 'select t.sales_1, sales_1_x from x'],
    ["select 'sales_1' from sales_1", "select 'sales_1' from preview_etl_2.sales_1"]
  ])('%s', (sql, saved) => {
    expect(withDatabase(sql, 'preview_etl_2', ['sales_1'])).toBe(saved);
  });

  it('puts backticks around names that need them', () => {
    expect(withDatabase('select * from `my table`', 'preview_etl_2', ['my table'])).toBe('select * from preview_etl_2.`my table`');
  });

  it('reads back what it wrote', () => {
    const shown = 'select region, count(*) from sales_1 group by region';
    expect(withoutDatabase(withDatabase(shown, 'preview_etl_2', ['sales_1']), 'preview_etl_2')).toBe(shown);
  });
});

describe('defaultSql', () => {
  it('selects every row of the table', () => {
    expect(defaultSql({ name: 'sales_1' })).toBe('select * from sales_1');
    expect(defaultSql({ name: 'my table' })).toBe('select * from `my table`');
  });
});

describe('newSqlOperator', () => {
  it('writes the JSON v1 wrote', () => {
    const parent = newSqlOperator(
      { kind: 'unsupported', className: 'x', destTable: { tblName: 'p', dbDisplayName: 'd', tblDisplayName: 'p' }, persist: undefined, thirdPartyPersists: [], json: { class_name: 'x' } },
      { tblName: 'q', dbDisplayName: 'ETL Database', tblDisplayName: 'q' },
      'select 1'
    );

    expect(etlOperatorToJson(parent)).toEqual({
      class_name: 'sql_query_operator',
      dest_table_configuration: { tbl_name: 'q', db_display_name: 'ETL Database', tbl_display_name: 'q' },
      is_persistent: false,
      third_party_persist_configurations: [],
      operator: { class_name: 'x' },
      query: 'select 1'
    });
  });
});

describe('sqlLanguage', () => {
  it('suggests the functions, the table and its columns', () => {
    const language = sqlLanguage(previewTable('sales_1'), [{ name: 'SUM', title: 'Sum', description: '', example: '' }]);

    expect(language.completions.map(spec => [spec.label, spec.kind])).toEqual([
      ['SUM', 'function'],
      ['sales_1', 'table'],
      ['region', 'field'],
      ['cnt', 'field']
    ]);
    expect(language.highlight).toEqual({ functions: ['SUM'], fields: ['region', 'cnt'] });
  });
});
