import { use, type HTMLAttributes } from 'react';
import { Tooltip } from 'antd';
import { TableTooltipContext } from './TableTooltipContext';

interface TooltipCellProps extends HTMLAttributes<HTMLTableCellElement> {
  tag: 'th' | 'td';
  /** The cell's full text (`onCell` / `onHeaderCell`). */
  'data-title'?: string;
}

/**
 * A table cell showing its full text after a second on it (v1 `TableTooltipUtils`, every cell with text). The tooltip
 * opens inside the dashboard's theme, so the theme's colors apply.
 */
export function TooltipCell({ tag: Tag, 'data-title': title, ...props }: TooltipCellProps) {
  const look = use(TableTooltipContext);
  const cell = <Tag {...props} />;
  if (!title || !look) return cell;
  return (
    <Tooltip
      title={title}
      mouseEnterDelay={1}
      placement="bottomLeft"
      color={look.background}
      getPopupContainer={trigger => trigger.closest<HTMLElement>('.dashboard-theme') ?? document.body}
      styles={{ container: { color: look.color, fontFamily: look.fontFamily, maxWidth: '30vw', maxHeight: 320, overflow: 'hidden', whiteSpace: 'pre-wrap' } }}
    >
      {cell}
    </Tooltip>
  );
}
