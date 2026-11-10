import { use, type HTMLAttributes } from 'react';
import { Tooltip } from 'antd';
import { inDashboardPage } from '../../theme/popupContainer';
import { TableTooltipContext } from './TableTooltipContext';

interface TooltipCellProps extends HTMLAttributes<HTMLTableCellElement> {
  tag: 'th' | 'td';
  /** The cell's full text (`onCell` / `onHeaderCell`). */
  'data-title'?: string;
}

/**
 * A table cell showing its full text after a second on it (v1 `TableTooltipUtils`, `.custom-table-tooltip`; every
 * cell with text). The tooltip opens inside the dashboard page, so the theme's colors apply.
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
      arrow={false}
      getPopupContainer={inDashboardPage}
      classNames={{ root: 'table-cell-tooltip' }}
      styles={{ container: { color: look.color, fontFamily: look.fontFamily } }}
    >
      {cell}
    </Tooltip>
  );
}
