import { useMemo } from 'react';
import type { TextWidget } from '@/core/dashboard/Widget';
import { sanitizeHtml, textRenderStyle } from './textWidget.utils';

/** v1 `TextViewer.vue` in view mode. Plain text keeps its line breaks, as v1's read-only textarea did. */
export function TextWidgetView({ widget }: { widget: TextWidget }) {
  const style = textRenderStyle(widget);
  const html = useMemo(() => (widget.isHtmlRender ? sanitizeHtml(widget.content) : ''), [widget.isHtmlRender, widget.content]);

  if (widget.isHtmlRender) {
    return <div className="h-full overflow-auto" style={style} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return (
    <div className="h-full overflow-auto whitespace-pre-wrap" style={style}>
      {widget.content}
    </div>
  );
}
