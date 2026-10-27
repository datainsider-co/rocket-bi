import type { CSSProperties, ReactNode } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { inDashboardPage } from '../../theme/popupContainer';
import { FilterTitle } from './FilterTitle';

interface DateSelectFilterViewProps {
  title?: string;
  titleStyle?: CSSProperties;
  /** The picked range, `DD/MM/YYYY - DD/MM/YYYY` or All Time. */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The calendar popover. */
  children: ReactNode;
}

/** v1 `DateSelectFilter2`: the title, then a bordered box with a calendar icon, the range and an arrow. */
export function DateSelectFilterView({ title, titleStyle, label, open, onOpenChange, children }: DateSelectFilterViewProps) {
  return (
    <div className={`filter-widget filter-widget--padded ${GRID_NO_DRAG_CLASS}`}>
      <FilterTitle text={title} style={{ ...titleStyle, textAlign: 'left' }} className="mb-1" />
      <Popover
        open={open}
        onOpenChange={onOpenChange}
        trigger="click"
        placement="bottomLeft"
        arrow={false}
        content={children}
        classNames={{ root: 'dashboard-popover' }}
        getPopupContainer={inDashboardPage}
        destroyOnHidden
      >
        <button type="button" className="filter-date" aria-label={title ? `${title}: ${label}` : label} aria-expanded={open}>
          <i className="di-icon-calendar filter-date__icon" aria-hidden />
          <span className="filter-date__label">{label}</span>
          <DownOutlined className="filter-date__arrow" aria-hidden />
        </button>
      </Popover>
    </div>
  );
}
