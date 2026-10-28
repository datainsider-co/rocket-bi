import type { SettingOption } from '../settingOptions';

/** The choices of v1's conditional formatting dialog (`FormattingOptions`). */

export const FORMAT_BY: readonly SettingOption[] = [
  { label: 'Color scale', value: 'scale' },
  { label: 'Rules', value: 'rules' }
];

export const APPLY_TO: readonly SettingOption[] = [
  { label: 'Values only', value: 'values_only' },
  { label: 'Values and totals', value: 'value_and_total' },
  { label: 'Totals only', value: 'totals_only' }
];

export const EMPTY_FORMATTING: readonly SettingOption[] = [
  { label: "Don't format", value: 'none' },
  { label: 'As zero', value: 'as_zero' },
  { label: 'Specific color', value: 'specific_color' }
];

export const FIRST_CONDITIONS: readonly SettingOption[] = [
  { label: '>', value: 'greater_than' },
  { label: '>=', value: 'greater_than_or_equal' },
  { label: '=', value: 'is' },
  { label: 'Blank', value: 'blank' }
];

export const SECOND_CONDITIONS: readonly SettingOption[] = [
  { label: '<', value: 'less_than' },
  { label: '<=', value: 'less_than_or_equal' }
];

export const VALUE_TYPES: readonly SettingOption[] = [
  { label: 'Number', value: 'number' },
  { label: 'Percent', value: 'percentage' }
];

export const BAR_DIRECTIONS: readonly SettingOption[] = [
  { label: 'Left to right', value: 'left' },
  { label: 'Right to left', value: 'right' }
];

export const ICON_LAYOUTS: readonly SettingOption[] = [
  { label: 'Left of data', value: 'left' },
  { label: 'Icon only', value: 'only_icon' },
  { label: 'Right of data', value: 'right' }
];

export const ICON_ALIGNS: readonly SettingOption[] = [
  { label: 'Top', value: 'top' },
  { label: 'Middle', value: 'center' },
  { label: 'Bottom', value: 'bottom' }
];
