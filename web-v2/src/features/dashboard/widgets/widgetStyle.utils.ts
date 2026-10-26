import type { CSSProperties } from 'react';
import type { TextStyleSetting, WidgetSetting } from '@/core/dashboard/DashboardSetting';
import type { Widget } from '@/core/dashboard/Widget';
import { asNumber, asString, getPath } from '@/core/json/json';
import { borderColorCss, radiusCss, withAlpha } from '../detail/dashboardDetail.utils';

/** What v1 charts store as their background when the user kept the theme's. */
const THEME_BACKGROUND = 'var(--chart-background-color)';

/**
 * The widget's own background (v1 `Widget.getBackgroundColor`): charts keep it in their viz options, text widgets in
 * `extra_data.style_settings`.
 */
export function widgetBackground(widget: Widget): { color?: string; opacity: number } {
  switch (widget.kind) {
    case 'chart':
      return { color: asString(getPath(widget.setting, ['options', 'options', 'background'])) || undefined, opacity: 100 };
    case 'text':
      return {
        color: asString(getPath(widget.json, ['extra_data', 'style_settings', 'background']), '#fff'),
        opacity: asNumber(getPath(widget.json, ['extra_data', 'style_settings', 'background_opacity']), 100)
      };
    default:
      return { color: asString(widget.json['background_color']) || undefined, opacity: 100 };
  }
}

function backgroundCss(widget: Widget, defaults: WidgetSetting): string {
  const { color, opacity } = widgetBackground(widget);
  if (!color || color === THEME_BACKGROUND) return withAlpha(defaults.background.color, defaults.background.opacity);
  return withAlpha(color, opacity);
}

function textVars(prefix: 'primary' | 'secondary', text: TextStyleSetting): Record<string, string> {
  return {
    [`--widget-${prefix}-font-family`]: text.fontFamily,
    [`--widget-${prefix}-font-size`]: text.fontSize,
    [`--widget-${prefix}-font-weight`]: text.isBold ? 'bold' : text.fontWeight,
    [`--widget-${prefix}-font-style`]: text.isItalic ? 'italic' : 'normal',
    [`--widget-${prefix}-font-underlined`]: text.isUnderline ? 'underline' : 'none',
    [`--widget-${prefix}-font-align`]: text.textAlign
  };
}

/**
 * The variables `WidgetContainer.css` and the widgets' own styles read (v1 `WidgetContainer.widgetStyle`). Chart
 * options refer to `--text-color` and the font variables, so they follow the dashboard's widget setting.
 */
export function widgetCssVars(widget: Widget, defaults: WidgetSetting): CSSProperties {
  const { border } = defaults;
  return {
    '--widget-background-color': backgroundCss(widget, defaults),
    '--widget-border-radius': radiusCss(border.radius),
    '--widget-padding': `${defaults.padding}px`,
    '--widget-border-width': `${border.width}px`,
    '--widget-border-color': borderColorCss(border),
    '--text-color': withAlpha(defaults.primaryText.color, defaults.primaryText.colorOpacity),
    '--secondary-text-color': withAlpha(defaults.secondaryText.color, defaults.secondaryText.colorOpacity),
    ...textVars('primary', defaults.primaryText),
    ...textVars('secondary', defaults.secondaryText)
  } as CSSProperties;
}
