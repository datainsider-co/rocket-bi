import { useState } from 'react';
import type { ReactNode } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { HeaderNavButton } from './HeaderNavButton';

interface HeaderDropdownProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  menu: MenuProps;
  placement?: 'bottomLeft' | 'bottomRight';
}

/** A header entry whose links open on hover (or tap), like v1's `.header-bar-item-group`. */
export function HeaderDropdown({ icon, label, active, menu, placement = 'bottomLeft' }: HeaderDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      trigger={['hover', 'click']}
      placement={placement}
      open={open}
      onOpenChange={setOpen}
      menu={{
        ...menu,
        style: { minWidth: 200 },
        onClick: info => {
          setOpen(false);
          menu.onClick?.(info);
        }
      }}
    >
      {/* Dropdown attaches its handlers and ref to this element. */}
      <span className="flex">
        <HeaderNavButton icon={icon} label={label} active={active} open={open} />
      </span>
    </Dropdown>
  );
}
