import { ConfigProvider, Drawer, Menu } from 'antd';
import { Link } from 'react-router';
import { CompanyBrand } from './CompanyBrand';
import { HEADER_NAV_ITEMS, activeNavKeys } from './header.utils';
import type { HeaderAccount, HeaderBrand, HeaderTheme } from './header.types';
import { handleSettingsClick, linkMenuItems, settingsMenuItems } from './headerMenuItems';
import type { MenuItems } from './headerMenuItems';
import { NAV_ICONS } from './navIcons';
import { SettingIcon } from './icons/SettingIcon';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  brand: HeaderBrand;
  pathname: string;
  account: HeaderAccount;
  theme: HeaderTheme;
}

const HEADER_COLOR = '#597fff';

/** White-on-brand menu, like v1's slide-in menu. */
const MENU_THEME = {
  components: {
    Menu: {
      darkItemBg: HEADER_COLOR,
      darkSubMenuItemBg: 'rgba(255, 255, 255, 0.1)',
      darkItemColor: 'rgba(255, 255, 255, 0.85)',
      darkItemHoverColor: '#fff',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.1)',
      darkItemSelectedColor: '#fff',
      darkItemSelectedBg: 'rgba(255, 255, 255, 0.2)'
    }
  }
};

/** v1's menu below `sm`: the header entries in a drawer from the left, groups expand in place. */
export function MobileNavDrawer({ open, onClose, brand, pathname, account, theme }: MobileNavDrawerProps) {
  const items: MenuItems = [
    ...HEADER_NAV_ITEMS.map(item =>
      item.children
        ? { key: item.key, icon: NAV_ICONS[item.key], label: item.label, children: linkMenuItems(item.children) }
        : { key: item.key, icon: NAV_ICONS[item.key], label: <Link to={item.to}>{item.label}</Link> }
    ),
    { key: 'settings', icon: <SettingIcon />, label: 'Settings', children: settingsMenuItems(account, theme) }
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      size={240}
      closable={false}
      title={<CompanyBrand brand={brand} />}
      styles={{
        header: { background: HEADER_COLOR, borderBottom: 0 },
        body: { background: HEADER_COLOR, padding: 0 }
      }}
    >
      <ConfigProvider theme={MENU_THEME}>
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={activeNavKeys(pathname, HEADER_NAV_ITEMS)}
          onClick={({ key }) => {
            handleSettingsClick(key, account, theme);
            onClose();
          }}
        />
      </ConfigProvider>
    </Drawer>
  );
}
