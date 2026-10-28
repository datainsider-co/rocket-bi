import { describe, expect, it } from 'vitest';
import type { BuilderData } from '@/core/chart-builder/BuilderData';
import { newFunctionData } from '@/core/chart-builder/chartCatalogue';
import { newConditionData } from '@/core/chart-builder/ConditionData';
import type { TableSchema } from '@/core/schema/SchemaService';
import { columnOfField, isFieldOf, syncTableFields } from './tableSync.utils';

const ref = { dbName: 'sample_v2', name: 'orders' };
const zone = { key: 'y_axis', title: 'Y-Axis' } as Parameters<typeof newFunctionData>[0]['zone'];

const tableField = (name: string, type: string, tblName = 'orders') => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: tblName, field_name: name, field_type: type });
const measureField = (name: string, expression: string) => ({ class_name: 'expression_field', db_name: 'sample_v2', tbl_name: 'orders', field_name: name, field_type: 'double', expression });
const calculatedField = (name: string, expression: string) => ({ class_name: 'calculated_field', db_name: 'sample_v2', tbl_name: 'orders', field_name: name, field_type: 'int64', expression });

const schema: TableSchema = {
  dbName: 'sample_v2',
  name: 'orders',
  columns: [
    { name: 'region', displayName: 'Region', type: 'string' },
    { name: 'items', displayName: 'Items', type: 'nested', nestedColumns: [{ name: 'qty', displayName: 'Qty', type: 'int32' }] }
  ],
  expressionColumns: [{ name: 'avg_rev', displayName: 'Average Revenue', type: 'double', expression: 'avg(revenue)' }],
  calculatedColumns: [{ name: 'double_qty', displayName: 'Double Qty', type: 'int64', expression: 'qty * 2' }]
};

const item = (id: number, field: Record<string, unknown>, columnName: string) => newFunctionData({ id, field, columnName, tableName: 'orders', zone });
const condition = (id: number, groupId: number, field: Record<string, unknown>, columnName: string) => newConditionData({ id, groupId, field, columnName, tableName: 'orders' });

describe('isFieldOf', () => {
  it.each([
    [tableField('region', 'string'), true],
    [measureField('avg_rev', 'avg(revenue)'), true],
    [calculatedField('double_qty', 'qty * 2'), true],
    [tableField('region', 'string', 'sales'), false],
    [{ class_name: 'view_field', view_name: 'orders', field_name: 'region' }, false],
    [{ class_name: 'chart_control_field' }, false]
  ])('tells whether %j is a column of the table', (field, expected) => {
    expect(isFieldOf(field, ref)).toBe(expected);
  });
});

describe('columnOfField', () => {
  it('finds a column, a measure and a calculated column in their own lists', () => {
    expect(columnOfField(tableField('region', 'string'), schema)?.displayName).toBe('Region');
    expect(columnOfField(measureField('avg_rev', ''), schema)?.displayName).toBe('Average Revenue');
    expect(columnOfField(calculatedField('double_qty', ''), schema)?.displayName).toBe('Double Qty');
    expect(columnOfField(tableField('avg_rev', 'double'), schema)).toBeUndefined();
  });

  it('finds the inner column of a nested field', () => {
    expect(columnOfField(tableField('`items.qty`', 'int32'), schema)?.displayName).toBe('Qty');
    expect(columnOfField(tableField('`items.nope`', 'int32'), schema)).toBeUndefined();
  });

  it('finds nothing for a table without that list or an unknown class', () => {
    expect(columnOfField(measureField('avg_rev', ''), { ...schema, expressionColumns: undefined })).toBeUndefined();
    expect(columnOfField({ class_name: 'view_field', field_name: 'region' }, schema)).toBeUndefined();
  });
});

describe('syncTableFields', () => {
  const data: BuilderData = {
    chartType: 'column_chart',
    configs: {
      x_axis: [item(1, tableField('region', 'string'), 'Region')],
      y_axis: [item(2, measureField('avg_rev', 'sum(revenue)'), 'Avg Rev'), { ...item(3, calculatedField('double_qty', 'qty * 3'), 'Double Qty'), name: 'My name' }],
      legend_optional: [item(4, tableField('country', 'string', 'sales'), 'country')]
    },
    filters: { 1: [condition(1, 1, tableField('gone', 'string'), 'gone')], 2: [condition(2, 2, tableField('region', 'string'), 'Region')] }
  };

  it('gives the data itself when the table is unchanged', () => {
    const current: TableSchema = { ...schema, expressionColumns: [{ name: 'avg_rev', displayName: 'Avg Rev', type: 'double', expression: 'sum(revenue)' }], calculatedColumns: [{ ...schema.calculatedColumns![0]!, expression: 'qty * 3' }] };
    const clean: BuilderData = { ...data, filters: { 2: data.filters[2]! } };
    const result = syncTableFields(clean, ref, current);
    expect(result.data).toBe(clean);
    expect(result.removed).toBe(0);
  });

  it('takes the new expression, type and name of edited columns, and drops those that are gone', () => {
    const { data: synced, removed } = syncTableFields(data, ref, schema);

    expect(removed).toBe(1);
    expect(synced.configs['x_axis']).toBe(data.configs['x_axis']);
    expect(synced.configs['legend_optional']).toBe(data.configs['legend_optional']);
    const [measure, calculated] = synced.configs['y_axis']!;
    expect(measure).toMatchObject({ name: 'Average Revenue', columnName: 'Average Revenue', field: measureField('avg_rev', 'avg(revenue)') });
    // A name the user changed stays.
    expect(calculated).toMatchObject({ name: 'My name', columnName: 'Double Qty', field: calculatedField('double_qty', 'qty * 2') });
    expect(synced.filters).toEqual({ 2: data.filters[2] });
  });

  it('drops every item and condition of a dropped table, with groups left empty', () => {
    const { data: synced, removed } = syncTableFields(data, ref, undefined);

    expect(removed).toBe(5);
    expect(synced.configs).toEqual({ x_axis: [], y_axis: [], legend_optional: data.configs['legend_optional'] });
    expect(synced.filters).toEqual({});
  });

  it('renames a condition with its column', () => {
    const renamed: TableSchema = { ...schema, columns: [{ name: 'region', displayName: 'Area', type: 'string' }] };
    const { data: synced } = syncTableFields({ ...data, configs: {}, filters: { 2: data.filters[2]! } }, ref, renamed);
    expect(synced.filters['2']?.[0]).toMatchObject({ columnName: 'Area', field: tableField('region', 'string') });
  });

  it('does not change the data it is given', () => {
    const snapshot = structuredClone(data);
    syncTableFields(data, ref, undefined);
    expect(data).toEqual(snapshot);
  });
});
