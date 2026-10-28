/** The choices of v1's settings (`shared/settings/common/options`), with the values v1 stored. */

export interface SettingOption<T extends string | number = string> {
  readonly label: string;
  readonly value: T;
}

export const PRIMARY_FONT = 'var(--widget-primary-font-family, Roboto)';
export const SECONDARY_FONT = 'var(--widget-secondary-font-family, Roboto)';
export const TEXT_COLOR = 'var(--text-color)';
export const SECONDARY_TEXT_COLOR = 'var(--secondary-text-color)';
export const GRID_LINE_COLOR = 'var(--grid-line-color)';

/** v1 `FontFamilyOptions`, sorted by name. */
export const FONT_FAMILIES: readonly SettingOption[] = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Barlow', value: 'Barlow' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Primary Text Font', value: PRIMARY_FONT },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Secondary Text Font', value: SECONDARY_FONT },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' }
];

/** v1 `SecondaryFontSizeOptions`, the sizes of titles, legends, axes and labels. */
export const FONT_SIZES: readonly SettingOption[] = [10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 42].map(size => ({ label: String(size), value: `${size}px` }));

/** v1 `PrimaryFontSizeOptions`, the sizes of a number chart's value. */
export const PRIMARY_FONT_SIZES: readonly SettingOption[] = [11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 42, 48, 64].map(size => ({ label: String(size), value: `${size}px` }));

/** v1 `DashOptions`. */
export const DASH_STYLES: readonly SettingOption[] = ['Solid', 'ShortDash', 'ShortDot', 'ShortDashDot', 'ShortDashDotDot', 'Dot', 'Dash', 'LongDash'].map(dash => ({
  label: dash,
  value: dash
}));

/** v1 `VerticalAlignOptions`. */
export const VERTICAL_ALIGNS: readonly SettingOption[] = [
  { label: 'Bottom', value: 'bottom' },
  { label: 'Top', value: 'top' },
  { label: 'Middle', value: 'middle' }
];

/** v1 `LegendLayoutOptions`. */
export const LEGEND_LAYOUTS: readonly SettingOption[] = [
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Vertical', value: 'vertical' }
];

/** v1 `PrecisionOptions`. */
export const PRECISIONS: readonly SettingOption<number>[] = [0, 1, 2, 3, 4, 5].map(precision => ({ label: String(precision), value: precision }));

/** v1 `DecimalPointOptions`. */
export const DECIMAL_POINTS: readonly SettingOption[] = [
  { label: ',', value: ',' },
  { label: '.', value: '.' }
];

/** v1 `ThousandSeparatorOptions`: stored as the separator itself (`thousandSep`). */
export const THOUSAND_SEPARATORS: readonly SettingOption[] = [
  { label: ',', value: ',' },
  { label: '.', value: '.' },
  { label: 'Space', value: ' ' },
  { label: 'None', value: '' }
];

/** v1 `DisplayUnitOptions` (`MetricNumberMode`). */
export const DISPLAY_UNITS: readonly SettingOption[] = [
  { label: 'Default', value: 'default' },
  { label: 'None', value: 'none' },
  { label: 'Mass', value: 'mass' },
  { label: 'Million', value: 'text' }
];

/** v1 `HeadComparisonOptions` / `TailComparisonOptions`: whether the bound itself is kept (`equal`). */
export const MIN_COMPARISONS: readonly SettingOption[] = [
  { label: 'Greater than or equal', value: 'true' },
  { label: 'Greater than', value: 'false' }
];

export const MAX_COMPARISONS: readonly SettingOption[] = [
  { label: 'Less than or equal', value: 'true' },
  { label: 'Less than', value: 'false' }
];

/** v1 `LabelFormatOptions` (`DataLabelFormatterMode`), for pie labels. */
export const LABEL_FORMATS: readonly SettingOption[] = [
  { label: 'Data value', value: 'name_and_value' },
  { label: 'Data percent', value: 'name_and_percent' },
  { label: 'Data', value: 'name' }
];
