import type { CSSProperties } from 'react';
import type { TabWidget } from '@/core/dashboard/Widget';
import { asRecord, asString, getPath } from '@/core/json/json';

/** How a tab or filter panel header looks (v1 `TabWidgetOptions.header`), what Config tab edits. */
export interface TabHeaderStyle {
  position: 'horizontal' | 'vertical';
  fontSize: string;
  color: string;
  activeBackground: string;
  inactiveBackground: string;
}

export function tabHeaderStyleOf(widget: TabWidget): TabHeaderStyle {
  const header = asRecord(getPath(widget.json, ['extra_data', 'header']));
  return {
    position: header['position'] === 'vertical' ? 'vertical' : 'horizontal',
    fontSize: asString(header['font_size'], '14px'),
    color: asString(header['color'], 'var(--text-color)'),
    activeBackground: asString(getPath(header, ['active', 'background']), 'var(--tab-widget-background-active)'),
    inactiveBackground: asString(getPath(header, ['in_active', 'background']), 'var(--tab-widget-background-deactive)')
  };
}

/** The header style as CSS variables for `TabWidget.css`. */
export function tabHeaderCssVars(style: TabHeaderStyle): CSSProperties {
  return {
    '--tab-font-size': style.fontSize,
    '--tab-color': style.color,
    '--tab-active-background': style.activeBackground,
    '--tab-inactive-background': style.inactiveBackground
  } as CSSProperties;
}
