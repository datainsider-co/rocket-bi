import type { CSSProperties } from 'react';
import type { TabWidget } from '@/core/dashboard/Widget';
import { asRecord, asString, getPath } from '@/core/json/json';

/** How a tab or filter panel header looks (v1 `TabWidgetOptions.header`), what Config tab edits. */
export interface TabHeaderStyle {
  position: 'horizontal' | 'vertical';
  fontFamily: string;
  fontSize: string;
  color: string;
  activeBackground: string;
  inactiveBackground: string;
}

/** v1 `TabWidget.defaultSetting().header`, what Revert puts back. */
export const DEFAULT_TAB_HEADER: TabHeaderStyle = {
  position: 'horizontal',
  fontFamily: 'Roboto',
  fontSize: '14px',
  color: 'var(--text-color)',
  activeBackground: 'var(--tab-widget-background-active)',
  inactiveBackground: 'var(--tab-widget-background-deactive)'
};

/** v1 `GroupFilter.defaultSetting().header`: a filter panel's one tab is its background. */
export const DEFAULT_PANEL_HEADER: TabHeaderStyle = { ...DEFAULT_TAB_HEADER, activeBackground: 'var(--chart-background-color)' };

export function tabHeaderStyleOf(widget: TabWidget): TabHeaderStyle {
  const header = asRecord(getPath(widget.json, ['extra_data', 'header']));
  const defaults = widget.kind === 'filter_panel' ? DEFAULT_PANEL_HEADER : DEFAULT_TAB_HEADER;
  return {
    position: header['position'] === 'vertical' ? 'vertical' : 'horizontal',
    fontFamily: asString(header['font_family']) || defaults.fontFamily,
    fontSize: asString(header['font_size'], defaults.fontSize),
    color: asString(header['color'], defaults.color),
    activeBackground: asString(getPath(header, ['active', 'background']), defaults.activeBackground),
    inactiveBackground: asString(getPath(header, ['in_active', 'background']), defaults.inactiveBackground)
  };
}

/** The tab to show: the picked one, or the last when tabs were deleted since; 0 without tabs. */
export function openTabIndex(active: number, tabCount: number): number {
  return Math.max(Math.min(active, tabCount - 1), 0);
}

/** The header style as CSS variables for `TabWidget.css`. */
export function tabHeaderCssVars(style: TabHeaderStyle): CSSProperties {
  return {
    '--tab-font-family': style.fontFamily,
    '--tab-font-size': style.fontSize,
    '--tab-color': style.color,
    '--tab-active-background': style.activeBackground,
    '--tab-inactive-background': style.inactiveBackground
  } as CSSProperties;
}
