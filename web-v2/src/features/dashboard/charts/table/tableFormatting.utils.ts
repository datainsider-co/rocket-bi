import type { CSSProperties } from 'react';
import { asArray, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';
import type { MinMaxValue } from '@/core/query/VisualizationResponse';
import { vizKey, type VizOptions } from '@/core/query/vizOptions';
import { createNumberFormat, DisplayUnit } from '../numberFormat';
import type { CellNumberFormat } from './table.utils';

/**
 * A table column's own formatting (v1 `fieldFormatting`, `conditionalFormatting`), keyed by its name the way v1 keyed it
 * (`vizKey`). v1 also matched a column to the first key starting with its name, so "sales" took "salesAmount"'s
 * formatting; v2 matches the name only.
 */

export function fieldFormattingOf(options: VizOptions, label: string): JsonObject | undefined {
  const formatting = asRecord(options['fieldFormatting'])[vizKey(label)];
  return isRecord(formatting) ? formatting : undefined;
}

/** A column's number format: its own display unit and precision over the table's (v1 `getBodyFormatter`). */
export function fieldNumberFormat(options: VizOptions, label: string): CellNumberFormat {
  const own = fieldFormattingOf(options, label) ?? {};
  const table = asRecord(asRecord(asRecord(options.plotOptions)['table'])['dataLabels']);
  const precision = own['precision'] ?? options.precision;
  return createNumberFormat({
    displayUnit: asString(own['displayUnit']) || asString(table['displayUnit']) || DisplayUnit.None,
    precision: typeof precision === 'number' ? precision : undefined,
    decimalPoint: typeof options.decimalPoint === 'string' ? options.decimalPoint : undefined,
    thousandSep: typeof options.thousandSep === 'string' ? options.thousandSep : undefined
  });
}

/**
 * The column's colors and alignment, on its values or its header when they apply there (v1 `TableFieldStyle`). The
 * header's background and alignment go through the table's variables, which its cells read.
 */
export function fieldCellStyle(formatting: JsonObject | undefined, part: 'values' | 'header'): CSSProperties | undefined {
  if (!formatting || formatting[part === 'values' ? 'applyValues' : 'applyHeader'] !== true) return undefined;
  const entries: [string, string][] = [
    ['color', asString(asRecord(formatting['style'])['color'])],
    [part === 'values' ? 'backgroundColor' : '--ft-header-bg', asString(formatting['backgroundColor'])],
    [part === 'values' ? 'textAlign' : '--ft-header-align', asString(formatting['align'])]
  ];
  return Object.fromEntries(entries.filter(([, value]) => value !== '')) as CSSProperties;
}

export interface ColumnRange {
  min: number;
  max: number;
}

/** The column's min and max over the whole result (`min_max_values`, by column name). */
export function columnRangeOf(values: readonly MinMaxValue[] | undefined, label: string): ColumnRange | undefined {
  const found = values?.find(value => value.valueName === label);
  return found && { min: found.min, max: found.max };
}

export function conditionalFormattingOf(options: VizOptions, label: string): JsonObject | undefined {
  const formatting = asRecord(options['conditionalFormatting'])[vizKey(label)];
  return isRecord(formatting) ? formatting : undefined;
}

function sameField(first: unknown, second: unknown): boolean {
  const key = (field: unknown) => {
    const record = asRecord(field);
    return ['db', 'tbl', 'field'].map(part => asString(record[`${part}Name`] ?? record[`${part}_name`])).join('.');
  };
  return isRecord(first) && isRecord(second) && key(first) === key(second);
}

/**
 * A background, font color or icon formatting v2 can compute from the cell itself: on, on the column's own field, by a
 * scale or rules, applied to values. v1 asked the server for extra columns, which a flatten table never returns, so v1
 * drew none of them.
 */
export function ownCellFormatting(formatting: JsonObject | undefined, type: 'backgroundColor' | 'color' | 'icon', columnField: unknown): JsonObject | undefined {
  const config = formatting?.[type];
  if (!isRecord(config) || config['enabled'] !== true) return undefined;
  if (config['applyTo'] === 'totals_only' || config['formatType'] === 'fieldValue') return undefined;
  return sameField(config['baseOnField'], columnField) ? config : undefined;
}

/** v1 `lodash.toNumber`: empty and null count as 0, text as NaN. */
function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  return typeof value === 'number' ? value : Number(value);
}

function ratio(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

function hexToRgba(color: string): [number, number, number, number] | undefined {
  const hex = color.trim().replace(/^#/, '');
  if (!/^([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(hex)) return undefined;
  const full = hex.length === 3 ? [...hex].map(char => char + char).join('') : hex;
  const parts = full.match(/../g)?.map(part => parseInt(part, 16)) ?? [];
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts.length > 3 ? (parts[3] ?? 255) / 255 : 1];
}

/** Between two colors (v1 `color-scales`, linear RGB); colors that aren't hex can't mix, the nearer one wins. */
export function mixColor(from: string, to: string, at: number): string {
  const start = hexToRgba(from);
  const end = hexToRgba(to);
  if (!start || !end) return at < 0.5 ? from : to;
  const [r, g, b, a] = start.map((part, index) => part + ((end[index] ?? part) - part) * at);
  return a === 1 ? `rgb(${Math.round(r ?? 0)}, ${Math.round(g ?? 0)}, ${Math.round(b ?? 0)})` : `rgba(${Math.round(r ?? 0)}, ${Math.round(g ?? 0)}, ${Math.round(b ?? 0)}, ${a})`;
}

function bound(config: JsonObject, fallback: number): number {
  const value = Number(asString(config['value'], String(config['value'] ?? '')));
  return config['type'] === 'custom' && asString(config['value'], String(config['value'] ?? '')) !== '' && Number.isFinite(value) ? value : fallback;
}

/** v1 color scale: the cell's place between min, center and max, as a color; empty cells as configured. */
export function scaleColor(value: unknown, scale: JsonObject, range: ColumnRange | undefined): string | undefined {
  const min = asRecord(scale['min']);
  const max = asRecord(scale['max']);
  const center = asRecord(scale['center']);
  const empty = asRecord(scale['default']);
  const minColor = asString(min['color'], '#d2f4ff');
  const maxColor = asString(max['color'], '#2d95ff');
  let number = typeof value === 'number' ? value : value === null || value === undefined || value === '' ? Number.NaN : Number(value);
  if (Number.isNaN(number)) {
    if (empty['formattingType'] === 'specific_color') return asString(empty['specificColor'], '#d2f4ff');
    if (empty['formattingType'] !== 'as_zero') return undefined;
    number = 0;
  }
  const low = bound(min, range?.min ?? 0);
  const high = bound(max, range?.max ?? 0);
  if (center['enabled'] === true) {
    const middle = bound(center, (low + high) / 2);
    const centerColor = asString(center['color'], '#e5ff85');
    const upper = ratio(number, middle, high);
    return number > middle && upper > 0 ? mixColor(centerColor, maxColor, upper) : mixColor(minColor, centerColor, ratio(number, low, middle));
  }
  return mixColor(minColor, maxColor, ratio(number, low, high));
}

function conditionMatches(condition: JsonObject, current: number): boolean {
  const target = Number(asString(condition['value'], String(condition['value'] ?? '')));
  switch (condition['conditionType']) {
    case 'greater_than':
      return current > target;
    case 'greater_than_or_equal':
      return current >= target;
    case 'less_than':
      return current < target;
    case 'less_than_or_equal':
      return current <= target;
    case 'is':
      return current === target;
    default:
      return false;
  }
}

/**
 * The first rule the cell matches (v1 `RuleResolver`), its value (a color or an icon). Percent rules compare the cell's
 * place between the column's min and max. `blank` matches what isn't a number; like v1, empty cells count as 0.
 */
export function matchRule(value: unknown, rules: readonly unknown[], range: ColumnRange | undefined): string | undefined {
  const number = toNumber(value);
  for (const item of rules) {
    const rule = asRecord(item);
    const first = asRecord(rule['firstCondition']);
    const second = asRecord(rule['secondCondition']);
    const type = first['conditionType'];
    if (type === 'blank') {
      if (Number.isNaN(number)) return asString(rule['value']);
      continue;
    }
    if (Number.isNaN(number)) continue;
    const current = first['valueType'] === 'percentage' ? ratio(number, range?.min ?? 0, range?.max ?? 0) * 100 : number;
    const matched = type === 'is' ? conditionMatches(first, current) : conditionMatches(first, current) && isRecord(rule['secondCondition']) && conditionMatches(second, current);
    if (matched) return asString(rule['value']);
  }
  return undefined;
}

/** A formatting's rules: `rules.colorRules` for colors, `rules.iconRules` for icons. */
export function rulesOf(config: JsonObject, type: 'color' | 'icon'): readonly unknown[] {
  return asArray(asRecord(config['rules'])[type === 'icon' ? 'iconRules' : 'colorRules']);
}

/** The color a background or font color formatting gives the cell. */
export function cellColor(value: unknown, config: JsonObject, range: ColumnRange | undefined): string | undefined {
  return config['formatType'] === 'rules' ? matchRule(value, rulesOf(config, 'color'), range) : scaleColor(value, asRecord(config['scale']), range);
}

/** Bars as percents of the cell; the axis sits on the left of the positive bar (right of the negative one when mirrored). */
export interface DataBar {
  positive: { left: number; width: number };
  negative: { left: number; width: number };
  positiveColor: string;
  negativeColor: string;
  /** The axis line, unless its color is fully transparent. */
  axisColor?: string;
  rightToLeft: boolean;
}

/** v1 data bar: negative values grow from the axis one way, positive ones the other, scaled by min and max. */
export function dataBarOf(value: unknown, config: JsonObject, range: ColumnRange | undefined): DataBar | undefined {
  if (config['enabled'] !== true) return undefined;
  const number = toNumber(value);
  if (Number.isNaN(number)) return undefined;
  const min = bound(asRecord(config['min']), range?.min ?? 0);
  const max = bound(asRecord(config['max']), range?.max ?? 0);
  let negativeArea = 0;
  if (min < 0 && max >= 0) negativeArea = Math.abs(min) / (Math.abs(min) + max);
  else if (min < 0 && max < 0) negativeArea = 1;
  const negativeRatio = min < 0 && number < 0 ? Math.min(number / min, 1) : 0;
  const positiveRatio = max > 0 && number > 0 ? Math.min(number / max, 1) : 0;
  const rightToLeft = config['direction'] === 'right';
  const positiveWidth = positiveRatio * (1 - negativeArea) * 100;
  const negativeWidth = negativeRatio * negativeArea * 100;
  const axis = negativeArea * 100;
  const axisColor = asString(config['axisColor']);
  const transparent = /^#[\da-f]{6}00$/i.test(axisColor) || axisColor === '';
  return {
    positive: rightToLeft ? { left: 100 - axis - positiveWidth, width: positiveWidth } : { left: axis, width: positiveWidth },
    negative: rightToLeft ? { left: 100 - axis, width: negativeWidth } : { left: axis - negativeWidth, width: negativeWidth },
    positiveColor: asString(config['positiveColor'], '#6289d2'),
    negativeColor: asString(config['negativeColor'], '#d8bc71'),
    ...(!transparent && { axisColor }),
    rightToLeft
  };
}
