import type { CSSProperties } from 'react';
import DOMPurify from 'dompurify';
import type { TextWidget } from '@/core/dashboard/Widget';
import { asBoolean, asNumber, asString, getPath, isRecord } from '@/core/json/json';

function styleSetting(widget: TextWidget, key: string): unknown {
  return getPath(widget.json, ['extra_data', 'style_settings', key]);
}

/**
 * v1 `TextWidget.getRenderStyle`, read from `extra_data.style_settings`. A widget saved before style settings existed
 * has none: v1 then takes its old `text_color` and `font_size`, else `defaultStyleSettings` (12px, the dashboard's
 * primary font). With settings, a missing one falls back to the getter's default (13px, Roboto).
 */
export function textRenderStyle(widget: TextWidget): CSSProperties {
  const hasSettings = isRecord(getPath(widget.json, ['extra_data', 'style_settings']));
  const legacy = (key: string) => (hasSettings ? '' : asString(widget.json[key]));
  return {
    color: asString(styleSetting(widget, 'font_color')) || legacy('text_color') || 'var(--text-color)',
    fontSize: asString(styleSetting(widget, 'font_size')) || legacy('font_size') || (hasSettings ? '13px' : '12px'),
    textAlign: asString(styleSetting(widget, 'text_align'), 'left') as CSSProperties['textAlign'],
    fontFamily: asString(styleSetting(widget, 'font_family')) || (hasSettings ? 'Roboto' : 'var(--widget-primary-font-family, Roboto)'),
    opacity: asNumber(styleSetting(widget, 'opacity'), 100) / 100,
    fontWeight: asBoolean(styleSetting(widget, 'is_bold')) ? 'bold' : undefined,
    fontStyle: asBoolean(styleSetting(widget, 'is_italic')) ? 'italic' : undefined,
    textDecoration: asBoolean(styleSetting(widget, 'is_underline')) ? 'underline' : undefined
  };
}

/** v1 rendered the stored HTML as is; v2 drops scripts and event handlers first. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
