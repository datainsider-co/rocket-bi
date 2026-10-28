import type { ReactNode } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { inDashboardPage } from '../../theme/popupContainer';

interface KpiDateRangeViewProps {
  /** The range, `MMM D, YYYY - MMM D, YYYY` or All Time. */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The popover's content; without it the range is only shown. */
  picker?: ReactNode;
}

/** v1 `DateRangeDropdown`: the number chart's range above its value, opening the date range popover. */
export function KpiDateRangeView({ label, open, onOpenChange, picker }: KpiDateRangeViewProps) {
  if (!picker) return <div className="kpi__date-range">{label}</div>;
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger="click"
      placement="bottom"
      arrow={false}
      content={picker}
      classNames={{ root: 'dashboard-popover' }}
      getPopupContainer={inDashboardPage}
      destroyOnHidden
    >
      <button type="button" className={`kpi__date-range kpi__date-range--picker ${GRID_NO_DRAG_CLASS}`} aria-label={`Date range: ${label}`} aria-expanded={open}>
        <span>{label}</span>
        <DownOutlined aria-hidden />
      </button>
    </Popover>
  );
}
