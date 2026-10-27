import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import {
  columnChoicesOf,
  defaultColorFormatting,
  defaultIconFormatting,
  fieldApplyChanges,
  fieldFormattingRevert,
  formattingOf,
  formattingSave,
  formattingToggle,
  ICON_CHOICES,
  iconStyleRules,
  invalidBounds,
  invalidRules,
  newRule,
  withValue
} from './formattingTabs.utils';

const revenueField = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'total_revenue', field_type: 'double' };
const columns = [
  { name: 'region', function: { class_name: 'select', field: { field_name: 'region', field_type: 'string' } } },
  { name: 'total_revenue', function: { class_name: 'select', field: revenueField } },
  { name: 'Count of orders', function: { class_name: 'count', field: { field_name: 'order_id', field_type: 'string' } } },
  'bad'
];
const [region, revenue, orders] = columnChoicesOf(columns);
const viz = (options: object) => options as VizOptions;

describe('columnChoicesOf', () => {
  it('keys columns like v1 and tells numbers apart', () => {
    expect(columnChoicesOf(columns).map(({ label, value, functionClass, numeric }) => ({ label, value, functionClass, numeric }))).toEqual([
      { label: 'region', value: 'region', functionClass: 'select', numeric: false },
      { label: 'total_revenue', value: 'totalRevenue', functionClass: 'select', numeric: true },
      { label: 'Count of orders', value: 'countOfOrders', functionClass: 'count', numeric: true }
    ]);
  });
});

describe('field formatting', () => {
  it('saves the colors and alignment shown when applying', () => {
    expect(fieldApplyChanges(viz({ fieldFormatting: { totalRevenue: { align: 'right' } } }), 'totalRevenue', 'applyValues', true)).toEqual({
      'fieldFormatting.totalRevenue.applyValues': true,
      'fieldFormatting.totalRevenue.backgroundColor': '#fff',
      'fieldFormatting.totalRevenue.style.color': 'var(--text-color)',
      'fieldFormatting.totalRevenue.align': 'right'
    });
  });

  it('reverts and lets the column follow the number format of the table', () => {
    const changes = fieldFormattingRevert('totalRevenue');
    expect(changes).toMatchObject({ 'fieldFormatting.totalRevenue.applyValues': false, 'fieldFormatting.totalRevenue.align': 'left' });
    expect(changes).toHaveProperty(['fieldFormatting.totalRevenue.displayUnit'], undefined);
    expect(changes).toHaveProperty(['fieldFormatting.totalRevenue.precision'], undefined);
  });
});

describe('formattingToggle', () => {
  it('starts a formatting from its defaults, on the column itself', () => {
    expect(formattingToggle(viz({}), revenue!, 'backgroundColor', true)).toEqual({
      'conditionalFormatting.totalRevenue.backgroundColor': defaultColorFormatting(revenue!),
      'conditionalFormatting.totalRevenue.label': 'total_revenue'
    });
    expect(defaultColorFormatting(revenue!)).toMatchObject({ formatType: 'scale', summarization: 'select', baseOnField: revenueField });
  });

  it('turns a stored formatting on or off, keeping its settings', () => {
    const stored = viz({ conditionalFormatting: { totalRevenue: { dataBar: { enabled: false, direction: 'right' } } } });
    expect(formattingToggle(stored, revenue!, 'dataBar', true)).toEqual({
      'conditionalFormatting.totalRevenue.dataBar.enabled': true,
      'conditionalFormatting.totalRevenue.label': 'total_revenue'
    });
    expect(formattingToggle(stored, revenue!, 'dataBar', false)).toMatchObject({ 'conditionalFormatting.totalRevenue.dataBar.enabled': false });
    expect(formattingOf(stored, 'totalRevenue', 'dataBar')).toEqual({ enabled: false, direction: 'right' });
    expect(formattingOf(stored, 'region', 'dataBar')).toBeUndefined();
  });

  it('keys by the column name', () => {
    expect(Object.keys(formattingToggle(viz({}), orders!, 'icon', true))).toEqual(['conditionalFormatting.countOfOrders.icon', 'conditionalFormatting.countOfOrders.label']);
    expect(region?.numeric).toBe(false);
  });
});

describe('formattingSave', () => {
  it('saves the whole formatting, on', () => {
    expect(formattingSave(revenue!, 'color', { enabled: false, formatType: 'rules' })).toEqual({
      'conditionalFormatting.totalRevenue.color': { enabled: true, formatType: 'rules' },
      'conditionalFormatting.totalRevenue.label': 'total_revenue'
    });
  });
});

describe('icons', () => {
  it('splits the range in equal percent bands', () => {
    const rules = iconStyleRules('style_3');
    expect(rules.map(rule => rule['value'])).toEqual(['⚫', '🔴', '🟡', '🟢']);
    expect(rules[1]).toMatchObject({ firstCondition: { conditionType: 'greater_than_or_equal', value: '25' }, secondCondition: { conditionType: 'less_than', value: '50' } });
    expect(rules[3]).toMatchObject({ secondCondition: { conditionType: 'less_than_or_equal', value: '100' } });
  });

  it('falls back to the default style', () => {
    expect(iconStyleRules('x').map(rule => rule['value'])).toEqual(['🔴', '🔶', '🟢']);
    expect(defaultIconFormatting(revenue!)).toMatchObject({ layout: 'left', align: 'center', style: 'default' });
    expect(ICON_CHOICES.length).toBeGreaterThan(10);
  });
});

describe('validation', () => {
  it('flags rules without numbers or with percents out of range', () => {
    const ok = newRule('a', '#f00');
    expect(invalidRules([ok])).toEqual([]);
    expect(invalidRules([{ ...ok, firstCondition: { conditionType: 'greater_than', value: 'x' } }, { firstCondition: { conditionType: 'blank' } }])).toEqual([0]);
    expect(invalidRules([{ firstCondition: { conditionType: 'is', value: '120', valueType: 'percentage' } }])).toEqual([0]);
    expect(invalidRules([{ firstCondition: { conditionType: 'is', value: '5' } }])).toEqual([]);
  });

  it('flags custom bounds that are not numbers', () => {
    expect(invalidBounds({ min: { type: 'custom', value: 'x' }, max: { type: 'default' } }, ['min', 'max'])).toEqual(['min']);
  });
});

describe('withValue', () => {
  it('changes a copy', () => {
    const config = { scale: { min: { type: 'default' } } };
    expect(withValue(config, 'scale.min.type', 'custom')).toEqual({ scale: { min: { type: 'custom' } } });
    expect(config.scale.min.type).toBe('default');
  });
});
