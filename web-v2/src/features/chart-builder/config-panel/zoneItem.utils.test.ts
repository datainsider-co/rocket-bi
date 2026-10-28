import { describe, expect, it } from 'vitest';
import { functionDataFromJson, type FunctionData } from '@/core/chart-builder/FunctionData';
import { canSort, configWithFamily, isMeasureItem, itemConfigOf, itemConfigSchema, showsFamily, showsType, topNLabel, withFamily, withItemConfig, type ItemConfig } from './zoneItem.utils';

const field = (type: string, className = 'table_field') => ({ class_name: className, db_name: 'db', tbl_name: 'sales', field_name: 'col', field_type: type });

const item = (overrides: Record<string, unknown> = {}): FunctionData =>
  functionDataFromJson({
    id: 1,
    name: 'revenue',
    function_family: 'Aggregation',
    function_type: 'Sum',
    field: field('double'),
    sorting: 'Unsorted',
    is_nested: false,
    display_as_column: true,
    num_elems_shown: 10,
    is_show_n_elements: false,
    ...overrides
  });

describe('showsFamily and showsType', () => {
  it('shows both for an aggregated column', () => {
    expect(showsFamily(item())).toBe(true);
    expect(showsType(item())).toBe(true);
  });

  it('shows no type for a family without one', () => {
    expect(showsType(item({ function_family: 'Group By', function_type: '' }))).toBe(false);
    expect(showsType(item({ function_type: undefined }))).toBe(false);
  });

  it.each([
    ['a measure', { function_type: 'Expression', field: field('double', 'expression_field') }],
    ['a chart control', { function_family: 'Dynamic', function_type: '' }],
    ['no family', { function_family: '' }]
  ])('hides the family of %s', (_name, overrides) => {
    expect(showsFamily(item(overrides))).toBe(false);
  });
});

describe('withFamily', () => {
  it("takes the family's first type and stops showing as a column", () => {
    expect(withFamily(item(), 'Date histogram')).toMatchObject({ functionFamily: 'Date histogram', functionType: 'Year', displayAsColumn: false });
    expect(withFamily(item(), 'Group By')).toMatchObject({ functionFamily: 'Group By', functionType: '' });
  });

  it('does not change the item it is given', () => {
    const before = item();
    withFamily(before, 'None');
    expect(before.functionFamily).toBe('Aggregation');
  });
});

describe('topNLabel', () => {
  it('labels a top N in use', () => {
    expect(topNLabel(item({ is_show_n_elements: true, num_elems_shown: '5' }))).toBe('Top 5 value(s)');
  });

  it.each([
    { is_show_n_elements: false },
    { is_show_n_elements: true, num_elems_shown: 0 },
    { is_show_n_elements: true, num_elems_shown: null }
  ])('has no label for %j', overrides => {
    expect(topNLabel(item(overrides))).toBeUndefined();
  });
});

describe('canSort', () => {
  it.each([
    ['sorting', 'Group By', true],
    ['y_axis', 'Aggregation', true],
    ['x_axis', 'Group By', false]
  ])('in %s with %s: %s', (zone, family, expected) => {
    expect(canSort(zone, family)).toBe(expected);
  });
});

describe('itemConfigSchema', () => {
  const config = (overrides: Partial<ItemConfig> = {}): ItemConfig => ({ ...itemConfigOf(item()), sorting: 'Descending', showTopN: true, ...overrides });
  const errorOf = (values: ItemConfig, path: string) => itemConfigSchema.safeParse(values).error?.issues.find(issue => issue.path[0] === path)?.message;

  it('takes a valid config', () => {
    expect(itemConfigSchema.safeParse(config()).success).toBe(true);
  });

  it('requires a display name', () => {
    expect(errorOf(config({ name: '  ' }), 'name')).toBe('Field is required.');
  });

  it.each([
    ['', 'Field is required.'],
    ['0', 'Field must be positive.'],
    ['-3', 'Field must be positive.'],
    ['2.5', 'Field must be positive.'],
    ['abc', 'Field must be positive.']
  ])('rejects the top N %j', (topN, message) => {
    expect(errorOf(config({ topN }), 'topN')).toBe(message);
  });

  it('ignores the top N while it is off or the item unsorted', () => {
    expect(itemConfigSchema.safeParse(config({ topN: '', showTopN: false })).success).toBe(true);
    expect(itemConfigSchema.safeParse(config({ topN: 'x', sorting: 'Unsorted' })).success).toBe(true);
  });
});

describe('itemConfigOf', () => {
  it('reads the item, a top N as text', () => {
    expect(itemConfigOf(item({ num_elems_shown: 10 }))).toEqual({ name: 'revenue', family: 'Aggregation', type: 'Sum', sorting: 'Unsorted', showTopN: false, topN: '10' });
  });

  it('reads a missing type and top N as empty', () => {
    expect(itemConfigOf(item({ function_type: undefined, num_elems_shown: null }))).toMatchObject({ type: '', topN: '' });
  });
});

describe('configWithFamily', () => {
  it("picks the family's first type for the column", () => {
    expect(configWithFamily(itemConfigOf(item()), item(), 'Date histogram')).toMatchObject({ family: 'Date histogram', type: 'Year' });
  });
});

describe('withItemConfig', () => {
  it('saves the name, function, sorting and a top N as a number', () => {
    const saved = withItemConfig(item(), { name: ' Total ', family: 'Aggregation', type: 'Average', sorting: 'Descending', showTopN: true, topN: '5' });
    expect(saved).toMatchObject({ name: 'Total', functionType: 'Average', sorting: 'Descending', isShowNElements: true, numElemsShown: 5, displayAsColumn: true });
  });

  it('keeps the stored top N when it is not used', () => {
    expect(withItemConfig(item({ num_elems_shown: '10' }), { ...itemConfigOf(item()), topN: '7' }).numElemsShown).toBe('10');
  });

  it('stops showing as a column when the family changes', () => {
    expect(withItemConfig(item(), { ...itemConfigOf(item()), family: 'Group By', type: '' }).displayAsColumn).toBe(false);
  });
});

describe('isMeasureItem', () => {
  it('tells measures from other fields', () => {
    expect(isMeasureItem({ field: { class_name: 'expression_field' } })).toBe(true);
    expect(isMeasureItem({ field: { class_name: 'calculated_field' } })).toBe(false);
    expect(isMeasureItem({ field: {} })).toBe(false);
  });
});
