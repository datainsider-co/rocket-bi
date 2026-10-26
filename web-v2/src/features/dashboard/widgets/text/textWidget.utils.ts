import type { CSSProperties } from 'react';
import DOMPurify from 'dompurify';
import type { TextWidget } from '@/core/dashboard/Widget';
import { asBoolean, asNumber, asString, getPath } from '@/core/json/json';

function styleSetting(widget: TextWidget, key: string): unknown {
  return getPath(widget.json, ['extra_data', 'style_settings', key]);
}

/** v1 `TextWidget.getRenderStyle`, read from `extra_data.style_settings` with v1's defaults. */
export function textRenderStyle(widget: TextWidget): CSSProperties {
  return {
    color: asString(styleSetting(widget, 'font_color'), 'var(--text-color)'),
    fontSize: asString(styleSetting(widget, 'font_size'), '13px'),
    textAlign: asString(styleSetting(widget, 'text_align'), 'left') as CSSProperties['textAlign'],
    fontFamily: asString(styleSetting(widget, 'font_family'), 'Roboto'),
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
