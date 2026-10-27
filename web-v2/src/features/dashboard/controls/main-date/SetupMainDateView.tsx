import { Popover } from 'antd';
import type { DateMode } from '@/core/query/dateRanges';
import { HeaderButton } from '../../header/HeaderButton';
import { inDashboardPage } from '../../theme/popupContainer';
import { MAIN_DATE_SETUP_MODES } from './mainDate.utils';

interface SetupMainDateViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (mode: DateMode) => void;
}

/**
 * v1 `SetupMainDateFilter`: in edit mode, a dashboard without a main date filter offers to set one up with a default
 * range. Edit Main Date opens it again on a dashboard that has one.
 */
export function SetupMainDateView({ open, onOpenChange, onPick }: SetupMainDateViewProps) {
  const content = (
    <div className="setup-main-date">
      <div className="setup-main-date__title">Choose Default Time Range</div>
      <div className="setup-main-date__list">
        {MAIN_DATE_SETUP_MODES.map(option => (
          <button
            key={option.value}
            type="button"
            className="setup-main-date__item"
            onClick={() => {
              onOpenChange(false);
              onPick(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      content={content}
      classNames={{ root: 'dashboard-popover' }}
      getPopupContainer={inDashboardPage}
    >
      <HeaderButton id="btn-set-main-date-filter" icon="di-icon-calendar" title="Setup Main Date Filter" aria-expanded={open} />
    </Popover>
  );
}
