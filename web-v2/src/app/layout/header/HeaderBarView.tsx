import { useState } from 'react';
import { CloseOutlined, MenuOutlined } from '@ant-design/icons';
import { CompanyBrand } from './CompanyBrand';
import { HeaderDropdown } from './HeaderDropdown';
import { HeaderNavButton } from './HeaderNavButton';
import { MobileNavDrawer } from './MobileNavDrawer';
import { SETTINGS_PATHS, activeLinkKeys, isPathActive } from './header.utils';
import type { HeaderNavItem } from './header.utils';
import type { HeaderAccount, HeaderBrand, HeaderTheme } from './header.types';
import { handleSettingsClick, linkMenuItems, settingsMenuItems } from './headerMenuItems';
import { NAV_ICONS } from './navIcons';
import { SettingIcon } from './icons/SettingIcon';

interface HeaderBarViewProps {
  brand: HeaderBrand;
  navItems: readonly HeaderNavItem[];
  pathname: string;
  account: HeaderAccount;
  theme: HeaderTheme;
}

/** v1 `HeaderBar.vue`: brand on the left, the nav entries and Settings on the right; a drawer below `md`. */
export function HeaderBarView({ brand, navItems, pathname, account, theme }: HeaderBarViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[999] flex h-[68px] shrink-0 items-center justify-between gap-2 bg-header px-8 max-sm:px-4">
      <CompanyBrand brand={brand} />

      <nav aria-label="Main" className="flex items-center gap-3 max-md:hidden">
        {navItems.map(item =>
          item.children ? (
            <HeaderDropdown
              key={item.key}
              icon={NAV_ICONS[item.key]}
              label={item.label}
              active={isPathActive(pathname, item.activePaths)}
              menu={{ items: linkMenuItems(item.children), selectedKeys: activeLinkKeys(pathname, item.children) }}
            />
          ) : (
            <HeaderNavButton
              key={item.key}
              icon={NAV_ICONS[item.key]}
              label={item.label}
              to={item.to}
              active={isPathActive(pathname, item.activePaths)}
            />
          )
        )}
        <HeaderDropdown
          icon={<SettingIcon />}
          label="Settings"
          placement="bottomRight"
          active={isPathActive(pathname, SETTINGS_PATHS)}
          menu={{
            items: settingsMenuItems(account, theme),
            onClick: ({ key }) => handleSettingsClick(key, account, theme)
          }}
        />
      </nav>

      <button
        type="button"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen(open => !open)}
        className="-mr-4 cursor-pointer border-0 bg-transparent p-[18px] text-xl text-white md:hidden"
      >
        {menuOpen ? <CloseOutlined /> : <MenuOutlined />}
      </button>
      <MobileNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        brand={brand}
        navItems={navItems}
        pathname={pathname}
        account={account}
        theme={theme}
      />
    </header>
  );
}
