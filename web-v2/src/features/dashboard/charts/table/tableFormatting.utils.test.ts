import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import {
  cellColor,
  columnRangeOf,
  conditionalFormattingOf,
  dataBarOf,
  fieldCellStyle,
  fieldFormattingOf,
  fieldNumberFormat,
  matchRule,
  mixColor,
  ownCellFormatting,
  scaleColor
} from './tableFormatting.utils';

const viz = (options: object) => options as VizOptions;
const field = { className: 'table_field', dbName: 'sample_v2', tblName: 'sales', fieldName: 'total_revenue' };
const storedField = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'total_revenue' };
const range = { min: 0, max: 100 };

describe('field formatting', () => {
  const options = viz({
    precision: 2,
    fieldFormatting: { totalRevenue: { applyValues: true, applyHeader: false, backgroundColor: '#fff', style: { color: '#123' }, align: 'right', displayUnit: 'mass', precision: 1 } }
  });

  it("finds a column's formatting by its name", () => {
    expect(fieldFormattingOf(options, 'total_revenue')).toMatchObject({ displayUnit: 'mass' });
    expect(fieldFormattingOf(options, 'total')).toBeUndefined();
  });

  it("formats numbers with the column's unit and precision", () => {
    expect(fieldNumberFormat(options, 'total_revenue')(1234567)).toBe('1.2Mg');
    expect(fieldNumberFormat(options, 'units_sold')(1234.567)).toBe('1,234.57');
  });

  it('styles the values or the header when it applies there', () => {
    const formatting = fieldFormattingOf(options, 'total_revenue');
    expect(fieldCellStyle(formatting, 'values')).toEqual({ color: '#123', backgroundColor: '#fff', textAlign: 'right' });
    expect(fieldCellStyle(formatting, 'header')).toBeUndefined();
    expect(fieldCellStyle({ ...formatting, applyHeader: true }, 'header')).toEqual({ color: '#123', '--ft-header-bg': '#fff', '--ft-header-align': 'right' });
    expect(fieldCellStyle(undefined, 'values')).toBeUndefined();
  });
});

describe('columnRangeOf', () => {
  it("finds the column's min and max by name", () => {
    expect(columnRangeOf([{ valueName: 'units_sold', min: 1, max: 9 }], 'units_sold')).toEqual({ min: 1, max: 9 });
    expect(columnRangeOf(undefined, 'units_sold')).toBeUndefined();
  });
});

describe('ownCellFormatting', () => {
  const formatting = conditionalFormattingOf(
    viz({ conditionalFormatting: { totalRevenue: { backgroundColor: { enabled: true, formatType: 'scale', applyTo: 'values_only', baseOnField: field }, color: { enabled: false } } } }),
    'total_revenue'
  );

  it("takes a formatting on the column's own field", () => {
    expect(ownCellFormatting(formatting, 'backgroundColor', storedField)).toMatchObject({ formatType: 'scale' });
  });

  it('skips what is off, on another field, by field value or on totals only', () => {
    expect(ownCellFormatting(formatting, 'color', storedField)).toBeUndefined();
    expect(ownCellFormatting(formatting, 'backgroundColor', { ...storedField, field_name: 'units_sold' })).toBeUndefined();
    expect(ownCellFormatting({ icon: { enabled: true, formatType: 'fieldValue', baseOnField: field } }, 'icon', storedField)).toBeUndefined();
    expect(ownCellFormatting({ icon: { enabled: true, applyTo: 'totals_only', baseOnField: field } }, 'icon', storedField)).toBeUndefined();
  });
});

describe('mixColor', () => {
  it('mixes hex colors linearly', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
    expect(mixColor('#000', '#fff', 0)).toBe('rgb(0, 0, 0)');
    expect(mixColor('#00000000', '#000000ff', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('takes the nearer color when one is not hex', () => {
    expect(mixColor('var(--a)', '#fff', 0.2)).toBe('var(--a)');
    expect(mixColor('var(--a)', '#fff', 0.8)).toBe('#fff');
  });
});

describe('scaleColor', () => {
  const scale = { min: { type: 'default', color: '#000000' }, max: { type: 'default', color: '#ffffff' }, default: { formattingType: 'none' } };

  it("places the value between the column's min and max", () => {
    expect(scaleColor(50, scale, range)).toBe('rgb(128, 128, 128)');
    expect(scaleColor('150', scale, range)).toBe('rgb(255, 255, 255)');
  });

  it('takes custom bounds', () => {
    expect(scaleColor(50, { ...scale, max: { type: 'custom', value: '50', color: '#ffffff' } }, range)).toBe('rgb(255, 255, 255)');
  });

  it('goes through the center when on', () => {
    const centered = { ...scale, center: { enabled: true, type: 'default', color: '#ff0000' } };
    expect(scaleColor(50, centered, range)).toBe('rgb(255, 0, 0)');
    expect(scaleColor(75, centered, range)).toBe('rgb(255, 128, 128)');
  });

  it('colors empty cells as configured', () => {
    expect(scaleColor(null, scale, range)).toBeUndefined();
    expect(scaleColor('', { ...scale, default: { formattingType: 'as_zero' } }, range)).toBe('rgb(0, 0, 0)');
    expect(scaleColor(null, { ...scale, default: { formattingType: 'specific_color', specificColor: '#abc' } }, range)).toBe('#abc');
  });
});

describe('matchRule', () => {
  const rule = (first: object, value: string, second?: object) => ({ firstCondition: first, ...(second && { secondCondition: second }), value });

  it('takes the first rule that matches', () => {
    const rules = [
      rule({ conditionType: 'greater_than_or_equal', value: '0', valueType: 'number' }, 'low', { conditionType: 'less_than', value: '10' }),
      rule({ conditionType: 'greater_than_or_equal', value: '5', valueType: 'number' }, 'high', { conditionType: 'less_than_or_equal', value: '100' })
    ];
    expect(matchRule(7, rules, range)).toBe('low');
    expect(matchRule(10, rules, range)).toBe('high');
    expect(matchRule(200, rules, range)).toBeUndefined();
  });

  it('compares percents of the range', () => {
    const rules = [rule({ conditionType: 'greater_than', value: '50', valueType: 'percentage' }, 'top', { conditionType: 'less_than_or_equal', value: '100', valueType: 'percentage' })];
    expect(matchRule(150, rules, { min: 100, max: 200 })).toBeUndefined();
    expect(matchRule(180, rules, { min: 100, max: 200 })).toBe('top');
  });

  it('matches is on the first condition, blank on text, and needs a second condition otherwise', () => {
    expect(matchRule('3', [rule({ conditionType: 'is', value: '3' }, 'three')], range)).toBe('three');
    expect(matchRule('abc', [rule({ conditionType: 'blank' }, 'blank')], range)).toBe('blank');
    expect(matchRule(null, [rule({ conditionType: 'blank' }, 'blank')], range)).toBeUndefined();
    expect(matchRule(5, [rule({ conditionType: 'greater_than', value: '1' }, 'x')], range)).toBeUndefined();
  });
});

describe('cellColor', () => {
  it('uses the rules or the scale', () => {
    const rules = { formatType: 'rules', rules: { colorRules: [{ firstCondition: { conditionType: 'is', value: '1' }, value: '#f00' }] } };
    expect(cellColor(1, rules, range)).toBe('#f00');
    expect(cellColor(100, { formatType: 'scale', scale: { max: { color: '#ffffff' } } }, range)).toBe('rgb(255, 255, 255)');
  });
});

describe('dataBarOf', () => {
  const bar = { enabled: true, min: { type: 'default' }, max: { type: 'default' }, positiveColor: '#00f', negativeColor: '#f00', axisColor: '#E6E6E600' };

  it('grows positive values from the left', () => {
    expect(dataBarOf(50, bar, range)).toEqual({
      positive: { left: 0, width: 50 },
      negative: { left: 0, width: 0 },
      positiveColor: '#00f',
      negativeColor: '#f00',
      rightToLeft: false
    });
  });

  it('puts the axis between negative and positive values', () => {
    const result = dataBarOf(-25, { ...bar, axisColor: '#000000' }, { min: -50, max: 50 });
    expect(result).toMatchObject({ positive: { left: 50, width: 0 }, negative: { left: 25, width: 25 }, axisColor: '#000000' });
  });

  it('mirrors right to left', () => {
    expect(dataBarOf(50, { ...bar, direction: 'right' }, range)).toMatchObject({ positive: { left: 50, width: 50 }, rightToLeft: true });
  });

  it('takes custom bounds and caps at the max', () => {
    expect(dataBarOf(500, { ...bar, max: { type: 'custom', value: '200' } }, range)?.positive.width).toBe(100);
  });

  it('draws nothing when off or on text', () => {
    expect(dataBarOf(50, { ...bar, enabled: false }, range)).toBeUndefined();
    expect(dataBarOf('abc', bar, range)).toBeUndefined();
  });
});
