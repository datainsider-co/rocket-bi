import type { CSSProperties } from 'react';
import type { TextWidget } from '@/core/dashboard/Widget';
import { DEFAULT_TEXT_STYLE, textStyleOf, type TextContent, type TextStyle } from '@/core/dashboard/widgetJson';

/** How the text looks while it is typed: the style the widget renders with. */
export function textPreviewStyle(style: TextStyle): CSSProperties {
  return {
    fontSize: style.fontSize,
    color: style.fontColor,
    textAlign: style.textAlign,
    fontWeight: style.isBold ? 'bold' : undefined,
    fontStyle: style.isItalic ? 'italic' : undefined,
    textDecoration: style.isUnderline ? 'underline' : undefined
  };
}

/** What the editor starts with: the widget's text and style, or an empty text. */
export function initialTextContent(widget: TextWidget | undefined): TextContent {
  if (!widget) return { content: '', isHtmlRender: false, style: DEFAULT_TEXT_STYLE };
  return { content: widget.content, isHtmlRender: widget.isHtmlRender, style: textStyleOf(widget.json) };
}
