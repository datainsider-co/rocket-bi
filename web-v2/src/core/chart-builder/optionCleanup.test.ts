import { describe, expect, it } from 'vitest';
import { asRecord, type JsonObject } from '@/core/json/json';
import { ChartType } from './chartType';
import { functionDataFromJson } from './FunctionData';
import { optionsAfterConvert, optionsAfterRemove } from './optionCleanup';

const item = (id: number, name: string) => functionDataFromJson({ id, name, function_family: 'Aggregation', function_type: 'Sum', field: {}, sorting: 'Unsorted', is_nested: false });

const options: JsonObject = {
  class_name: 'table_chart_setting',
  options: {
    title: { text: 'Sales' },
    field_formatting: { total_revenue: { precision: 3 }, region: { align: 'right' } },
    conditional_formatting: { total_revenue: { data_bar: { enabled: true } } }
  }
};

const stored = (result: JsonObject) => asRecord(result['options']);

describe('optionsAfterRemove', () => {
  const revenue = item(2, 'Total Revenue');

  it("drops the removed column's field and conditional formatting from a collapse table", () => {
    const result = optionsAfterRemove(ChartType.CollapseTable, 'columns', options, item(2, 'total_revenue'), { columns: [item(1, 'region')] });
    expect(stored(result)).toEqual({ title: { text: 'Sales' }, field_formatting: { region: { align: 'right' } }, conditional_formatting: {} });
    expect(result['class_name']).toBe('table_chart_setting');
  });

  it('keys the formatting by the camel case name, as v1', () => {
    const result = optionsAfterRemove(ChartType.CollapseTable, 'columns', options, revenue, { columns: [] });
    expect(stored(result)).not.toHaveProperty('field_formatting.total_revenue');
  });

  it('keeps it while another column has the same name', () => {
    expect(optionsAfterRemove(ChartType.CollapseTable, 'columns', options, revenue, { columns: [item(3, 'total_revenue')] })).toBe(options);
  });

  it('leaves the options alone for the Sorting zone, other chart types, and columns without formatting', () => {
    expect(optionsAfterRemove(ChartType.CollapseTable, 'sorting', options, revenue, {})).toBe(options);
    expect(optionsAfterRemove(ChartType.Table, 'columns', options, revenue, {})).toBe(options);
    expect(optionsAfterRemove(ChartType.CollapseTable, 'columns', options, item(4, 'units_sold'), {})).toBe(options);
  });

  it('does not change its input', () => {
    const before = structuredClone(options);
    optionsAfterRemove(ChartType.CollapseTable, 'columns', options, revenue, {});
    expect(options).toEqual(before);
  });
});

describe('optionsAfterConvert', () => {
  it('drops all conditional formatting of a collapse table, keeping the field formatting', () => {
    expect(stored(optionsAfterConvert(ChartType.CollapseTable, options))).toEqual({
      title: { text: 'Sales' },
      field_formatting: { total_revenue: { precision: 3 }, region: { align: 'right' } }
    });
  });

  it('leaves other chart types and tables without conditional formatting alone', () => {
    expect(optionsAfterConvert(ChartType.Table, options)).toBe(options);
    const plain = { class_name: 'table_chart_setting', options: { title: { text: 'Sales' } } };
    expect(optionsAfterConvert(ChartType.CollapseTable, plain)).toBe(plain);
  });
});
