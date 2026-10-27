import type { ReactNode } from 'react';
import { Popover } from 'antd';
import { inDashboardPage } from '../../theme/popupContainer';

interface MainDatePickerViewProps {
  /** The applied range, `DD/MM/YYYY - DD/MM/YYYY` or All Time. */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The popover's content. */
  children: ReactNode;
}

/** v1 `DiCalendar`'s input: a calendar icon and the applied range, opening the main date popover. */
export function MainDatePickerView({ label, open, onOpenChange, children }: MainDatePickerViewProps) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger="click"
      placement="bottom"
      arrow={false}
      content={children}
      classNames={{ root: 'dashboard-popover' }}
      getPopupContainer={inDashboardPage}
      destroyOnHidden
    >
      <button type="button" className="main-date-trigger" aria-label={`Main date: ${label}`} aria-expanded={open}>
        <i className="di-icon-calendar main-date-trigger__icon" aria-hidden />
        <span className="main-date-trigger__label">{label}</span>
      </button>
    </Popover>
  );
}
