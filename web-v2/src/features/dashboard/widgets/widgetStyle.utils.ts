import type { CSSProperties } from 'react';
import type { TextStyleSetting, WidgetSetting } from '@/core/dashboard/DashboardSetting';
import type { Widget } from '@/core/dashboard/Widget';
import { asNumber, asString, getPath } from '@/core/json/json';
import { borderColorCss, radiusCss, withAlpha } from '../detail/dashboardDetail.utils';
import { ChartVizClass } from '../charts/vizClass';

/** What v1 charts store as their background when the user kept the theme's. */
const THEME_BACKGROUND = 'var(--chart-background-color)';
/** v1 `ChartOption.getBackgroundColor` for a chart whose options have no background. */
const CHART_DEFAULT_BACKGROUND = '#FAFAFB';
/** v1 `getOverridePadding`: these filters sit closer to their card's edge than the dashboard's widget padding. */
const COMPACT_FILTER_CLASSES = new Set<string>([ChartVizClass.TabFilter, ChartVizClass.Slicer, ChartVizClass.DateSelect, ChartVizClass.Input]);
const COMPACT_FILTER_PADDING = '6px';

/**
 * The widget's own background (v1 `Widget.getBackgroundColor`): charts keep it in their viz options, text widgets in
 * `extra_data.style_settings`.
 */
export function widgetBackground(widget: Widget): { color?: string; opacity: number } {
  switch (widget.kind) {
    case 'chart':
      return { color: asString(getPath(widget.setting, ['options', 'options', 'background'])) || CHART_DEFAULT_BACKGROUND, opacity: 100 };
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

/** The widget's padding: v1's override for some filters, else the dashboard's (v1 `Widget.getOverridePadding`). */
export function widgetPadding(widget: Widget, defaults: WidgetSetting): string {
  if (widget.kind === 'chart' && COMPACT_FILTER_CLASSES.has(asString(getPath(widget.setting, ['options', 'class_name'])))) {
    return COMPACT_FILTER_PADDING;
  }
  return `${defaults.padding}px`;
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
    '--widget-padding': widgetPadding(widget, defaults),
    '--widget-border-width': `${border.width}px`,
    '--widget-border-color': borderColorCss(border),
    '--text-color': withAlpha(defaults.primaryText.color, defaults.primaryText.colorOpacity),
    '--secondary-text-color': withAlpha(defaults.secondaryText.color, defaults.secondaryText.colorOpacity),
    ...textVars('primary', defaults.primaryText),
    ...textVars('secondary', defaults.secondaryText)
  } as CSSProperties;
}
