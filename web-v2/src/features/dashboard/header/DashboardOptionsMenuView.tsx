import { useState } from 'react';
import { Popover } from 'antd';
import { inDashboardPage } from '../theme/popupContainer';
import { HeaderButton } from './HeaderButton';
import type { OptionItem } from './headerOptions.utils';

interface DashboardOptionsMenuViewProps {
  items: readonly OptionItem[];
}

/** v1 `#dashboard-options-menu`: the Options button and its popover of icon and label rows. Nothing without items. */
export function DashboardOptionsMenuView({ items }: DashboardOptionsMenuViewProps) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const menu = (
    <div className="dashboard-options-menu" role="menu" aria-label="Options">
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          className="dashboard-options-menu__item"
          onClick={() => {
            setOpen(false);
            item.onSelect();
          }}
        >
          <i className={item.icon} aria-hidden />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottom"
      arrow={false}
      content={menu}
      classNames={{ root: 'dashboard-popover' }}
      getPopupContainer={inDashboardPage}
    >
      <HeaderButton icon="di-icon-option" title="Options" aria-haspopup="menu" aria-expanded={open} />
    </Popover>
  );
}
