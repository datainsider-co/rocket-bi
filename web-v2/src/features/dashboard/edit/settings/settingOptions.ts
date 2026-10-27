import { FitMode, SizeUnit } from '@/core/dashboard/DashboardSetting';

/** The choices of the settings dialogs' dropdowns, with v1's labels and stored values. */
export interface SettingOption {
  value: string;
  label: string;
}

/** v1 `DashboardSizeSetting.unitOptions`. */
export const SIZE_UNITS: readonly SettingOption[] = [
  { value: SizeUnit.Px, label: 'px' },
  { value: SizeUnit.Percent, label: '%' }
];

/** v1 `DashboardSizeSetting.strokePositionOptions`. */
export const STROKE_POSITIONS: readonly SettingOption[] = [
  { value: 'outside', label: 'Outside Stroke' },
  { value: 'inside', label: 'Inside Stroke' },
  { value: 'center', label: 'Center Stroke' }
];

/** v1 `DashboardBackgroundSetting.fitModeOptions`: every fit mode, sorted by label. */
export const FIT_MODES: readonly SettingOption[] = [
  { value: FitMode.Fill, label: 'Fill' },
  { value: FitMode.Fit, label: 'Fit' },
  { value: FitMode.None, label: 'None' },
  { value: FitMode.Parallax, label: 'Parallax' },
  { value: FitMode.Repeat, label: 'Repeat' },
  { value: FitMode.RepeatX, label: 'Repeat X' },
  { value: FitMode.RepeatY, label: 'Repeat Y' },
  { value: FitMode.Stretch, label: 'Stretch' }
];

/** v1 `FontFamilyOptions` without the theme's own fonts, sorted by name. */
export const FONT_FAMILIES: readonly SettingOption[] = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Barlow', label: 'Barlow' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' }
];

/** v1 `SecondaryFontSizeOptions`, which both text tabs of Edit Widgets offered. */
export const FONT_SIZES: readonly SettingOption[] = ['10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '42'].map(size => ({ value: `${size}px`, label: size }));

/** v1 `FontWeightOptions`. */
export const FONT_WEIGHTS: readonly SettingOption[] = [
  { value: 'normal', label: 'Normal' },
  ...['100', '200', '300', '400', '500', '600', '700', '800', '900'].map(weight => ({ value: weight, label: weight }))
];
