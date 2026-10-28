import type { HTMLAttributes } from 'react';
import { TooltipCell } from './TooltipCell';

type CellProps = HTMLAttributes<HTMLTableCellElement>;

/** antd's cell components for the table, each cell with its tooltip; module level so they stay the same components. */
export const TABLE_COMPONENTS = {
  header: { cell: (props: CellProps) => <TooltipCell tag="th" {...props} /> },
  body: { cell: (props: CellProps) => <TooltipCell tag="td" {...props} /> }
};
