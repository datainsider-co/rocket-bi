import { cloneDeep, get, set } from 'lodash-es';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import { asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';
import { vizKey, type VizOptions } from '@/core/query/vizOptions';
import { isNumberType } from '@/core/schema/fieldTypes';
import { TEXT_COLOR, type SettingOption } from '../settingOptions';

/** A table's Field formatting and Conditional formatting tabs (v1 `FieldFormattingTab`, `ConditionalFormattingTab`). */

export interface ColumnChoice extends SettingOption {
  /** The column's name, as v1 labels its formatting. */
  readonly name: string;
  readonly field: JsonObject;
  /** The column's function (`select`, `sum`, ...), v1's default summarization. */
  readonly functionClass: string;
  /** Numbers or an aggregation: the columns with min / max, data bars and computed colors. */
  readonly numeric: boolean;
}

const NOT_AGGREGATE = new Set(['select', 'select_distinct', 'group', '']);

/** The query's columns to pick from, keyed like v1 (`vizKey` of the name). */
export function columnChoicesOf(columns: readonly unknown[]): ColumnChoice[] {
  return columns.filter(isRecord).map(column => {
    const name = asString(column['name']);
    const fn = asRecord(column['function']);
    const field = asRecord(fn['field']);
    const functionClass = asString(fn['class_name']);
    return { label: name, value: vizKey(name), name, field, functionClass, numeric: !NOT_AGGREGATE.has(functionClass) || isNumberType(asString(field['field_type'])) };
  });
}

// Field formatting

export const FIELD_DEFAULTS = { color: TEXT_COLOR, backgroundColor: '#fff', align: 'left', precision: 2 } as const;

export const fieldPath = (key: string, path: string) => `fieldFormatting.${key}.${path}`;

/** v1: applying the formatting to a part saves its colors and alignment as shown. */
export function fieldApplyChanges(viz: VizOptions, key: string, part: 'applyHeader' | 'applyValues', enabled: boolean): VizChanges {
  const read = (path: string, fallback: string) => {
    const value: unknown = get(viz, fieldPath(key, path));
    return typeof value === 'string' ? value : fallback;
  };
  return {
    [fieldPath(key, part)]: enabled,
    [fieldPath(key, 'backgroundColor')]: read('backgroundColor', FIELD_DEFAULTS.backgroundColor),
    [fieldPath(key, 'style.color')]: read('style.color', FIELD_DEFAULTS.color),
    [fieldPath(key, 'align')]: read('align', FIELD_DEFAULTS.align)
  };
}

/**
 * v1 `FieldFormattingTab.handleRevert`. v1 also wrote display unit None and precision 2, which overrode the table's
 * number format; v2 removes them so the column follows the table again.
 */
export function fieldFormattingRevert(key: string): VizChanges {
  return {
    [fieldPath(key, 'applyHeader')]: false,
    [fieldPath(key, 'applyValues')]: false,
    [fieldPath(key, 'applyTotals')]: false,
    [fieldPath(key, 'backgroundColor')]: FIELD_DEFAULTS.backgroundColor,
    [fieldPath(key, 'style.color')]: FIELD_DEFAULTS.color,
    [fieldPath(key, 'align')]: FIELD_DEFAULTS.align,
    [fieldPath(key, 'displayUnit')]: undefined,
    [fieldPath(key, 'precision')]: undefined
  };
}

// Conditional formatting

export type FormattingType = 'backgroundColor' | 'color' | 'dataBar' | 'icon';

export const conditionalPath = (key: string, type?: FormattingType) => `conditionalFormatting.${key}${type ? `.${type}` : ''}`;

const bound = (color: string) => ({ enabled: true, type: 'default', color });

/** v1 `ColorFormatSetting` defaults: a scale from the column's min to max, on its own field. */
export function defaultColorFormatting(column: ColumnChoice): JsonObject {
  return {
    enabled: true,
    formatType: 'scale',
    applyTo: 'values_only',
    summarization: column.functionClass,
    baseOnField: column.field,
    scale: { min: bound('#d2f4ff'), center: { ...bound('#e5ff85'), enabled: false }, max: bound('#2d95ff'), default: { formattingType: 'as_zero', specificColor: '#d2f4ff' } },
    rules: { colorRules: [] }
  };
}

/** v1 `DataBarSetting` defaults. */
export function defaultDataBar(): JsonObject {
  const end = { enabled: true, type: 'default', value: '', color: '' };
  return { enabled: true, min: end, max: end, direction: 'left', axisColor: '#E6E6E600', negativeColor: '#d8bc71', positiveColor: '#6289d2' };
}

/** v1 `IconFormatSetting`'s styles: icons for percent bands of the column's range. */
const ICON_STYLE_ICONS: Readonly<Record<string, readonly string[]>> = {
  default: ['🔴', '🔶', '🟢'],
  style_1: ['❌', '⚠️', '✅'],
  style_2: ['🔴', '🟡', '🟢'],
  style_3: ['⚫', '🔴', '🟡', '🟢'],
  style_4: ['⬛', '🟥', '🟨', '🟩'],
  style_5: ['⬇️', '➡️', '⬆️']
};

export const ICON_STYLES: readonly SettingOption[] = Object.entries(ICON_STYLE_ICONS).map(([value, icons]) => ({ label: icons.join(' '), value }));

/** The icons offered for a rule: every style's. */
export const ICON_CHOICES: readonly SettingOption[] = [...new Set(Object.values(ICON_STYLE_ICONS).flat())].map(icon => ({ label: icon, value: icon }));

/** A style's rules: equal percent bands, `>=` the lower bound and `<` the upper one, `<=` for the last. */
export function iconStyleRules(style: string): JsonObject[] {
  const icons = ICON_STYLE_ICONS[style] ?? ICON_STYLE_ICONS['default'] ?? [];
  const step = 100 / icons.length;
  return icons.map((icon, index) => ({
    id: `${style}_${index}`,
    firstCondition: { conditionType: 'greater_than_or_equal', value: String(Math.round(step * index)), valueType: 'percentage' },
    secondCondition: { conditionType: index === icons.length - 1 ? 'less_than_or_equal' : 'less_than', value: String(Math.round(step * (index + 1))), valueType: 'percentage' },
    value: icon
  }));
}

export function defaultIconFormatting(column: ColumnChoice): JsonObject {
  return {
    enabled: true,
    formatType: 'rules',
    applyTo: 'values_only',
    summarization: column.functionClass,
    baseOnField: column.field,
    layout: 'left',
    align: 'center',
    style: 'default',
    rules: { iconRules: iconStyleRules('default') }
  };
}

export function defaultFormatting(type: FormattingType, column: ColumnChoice): JsonObject {
  if (type === 'dataBar') return defaultDataBar();
  return type === 'icon' ? defaultIconFormatting(column) : defaultColorFormatting(column);
}

export function formattingOf(viz: VizOptions, key: string, type: FormattingType): JsonObject | undefined {
  const value: unknown = get(viz, conditionalPath(key, type));
  return isRecord(value) ? value : undefined;
}

/**
 * v1 `ConditionalFormattingTab` toggles: turning one on starts from its defaults, turning it off keeps its settings.
 * v1 reset a data bar to its defaults each time it was turned on; v2 keeps what was set.
 */
export function formattingToggle(viz: VizOptions, column: ColumnChoice, type: FormattingType, enabled: boolean): VizChanges {
  const stored = formattingOf(viz, column.value, type);
  const changes: VizChanges = enabled && !stored ? { [conditionalPath(column.value, type)]: defaultFormatting(type, column) } : { [`${conditionalPath(column.value, type)}.enabled`]: enabled };
  return { ...changes, [`${conditionalPath(column.value)}.label`]: column.name };
}

/** Saving the dialog: the whole formatting, on (v1 `handleSaveSetting`). */
export function formattingSave(column: ColumnChoice, type: FormattingType, config: JsonObject): VizChanges {
  return { [conditionalPath(column.value, type)]: { ...config, enabled: true }, [`${conditionalPath(column.value)}.label`]: column.name };
}

/** v1 `RulePanel`'s new rule. */
export function newRule(id: string, value: string): JsonObject {
  return {
    id,
    firstCondition: { conditionType: 'greater_than_or_equal', value: '0', valueType: 'number' },
    secondCondition: { conditionType: 'less_than', value: '0', valueType: 'number' },
    value
  };
}

const isNumeric = (value: unknown) => {
  const text = asString(value, String(value ?? '')).trim();
  return text !== '' && Number.isFinite(Number(text));
};

/** v1 `RuleUtils` validation: numbers where a rule compares, percents within 0–100; blank needs nothing. */
export function invalidRules(rules: readonly unknown[]): number[] {
  return rules.flatMap((item, index) => {
    const rule = asRecord(item);
    const first = asRecord(rule['firstCondition']);
    if (first['conditionType'] === 'blank') return [];
    const conditions = first['conditionType'] === 'is' ? [first] : [first, asRecord(rule['secondCondition'])];
    const valid = conditions.every(condition => {
      if (!isNumeric(condition['value'])) return false;
      const value = Number(condition['value']);
      return first['valueType'] !== 'percentage' || (value >= 0 && value <= 100);
    });
    return valid ? [] : [index];
  });
}

/** Custom scale or data bar bounds must be numbers. */
export function invalidBounds(config: JsonObject, names: readonly string[]): string[] {
  return names.filter(name => {
    const end = asRecord(config[name]);
    return end['type'] === 'custom' && !isNumeric(end['value']);
  });
}

/** The dialog's draft with one value changed, the draft left as it was. */
export function withValue(config: JsonObject, path: string, value: unknown): JsonObject {
  return set(cloneDeep(config), path, value);
}
