import { widgetFromJson, type TextWidget } from '@/core/dashboard/Widget';
import { DEFAULT_TEXT_STYLE, textStyleOf, textWidgetJson, type TextContent } from '@/core/dashboard/widgetJson';
import type { JsonObject } from '@/core/json/json';
import type { SettingOption } from '@/shared/settings/settingOption';
import { FONT_FAMILIES } from './settings/settingOptions';

/** v1 `FontFamilyOptions`: the fonts, and the dashboard's own two (Edit Widgets), by name. */
export const TEXT_FONT_FAMILIES: readonly SettingOption[] = [
  ...FONT_FAMILIES,
  { value: 'var(--widget-primary-font-family, Roboto)', label: 'Primary Text Font' },
  { value: 'var(--widget-secondary-font-family, Roboto)', label: 'Secondary Text Font' }
].sort((one, other) => one.label.localeCompare(other.label));

/** v1 `PrimaryFontSizeOptions`. */
export const TEXT_FONT_SIZES: readonly SettingOption[] = [11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 42, 48, 64].map(size => ({ value: `${size}px`, label: String(size) }));

/** What the editor starts with: the widget's text and style, or an empty text. */
export function initialTextContent(widget: TextWidget | undefined): TextContent {
  if (!widget) return { content: '', isHtmlRender: false, style: DEFAULT_TEXT_STYLE };
  return { content: widget.content, isHtmlRender: widget.isHtmlRender, style: textStyleOf(widget.json) };
}

/** The widget as it would be saved, for the editor's Review; `json` is the widget being edited, empty for a new one. */
export function reviewedTextWidget(json: JsonObject, content: TextContent): TextWidget {
  return widgetFromJson(textWidgetJson(json, content)) as TextWidget;
}

/** A color a picker can show: the hex itself, nothing for a theme variable. */
export function pickerColor(color: string): string | undefined {
  return color.startsWith('#') ? color : undefined;
}
