import { Avatar, Switch } from 'antd';
import type { MenuProps } from 'antd';
import { Link } from 'react-router';
import { ORGANIZATION_SETTINGS_PATH, USER_PROFILE_PATH, avatarInitial } from './header.utils';
import type { HeaderLink } from './header.utils';
import type { HeaderAccount, HeaderTheme } from './header.types';

export type MenuItems = NonNullable<MenuProps['items']>;

const DARK_MODE_KEY = 'dark-mode';
const SIGN_OUT_KEY = 'sign-out';

export function linkMenuItems(links: readonly HeaderLink[]): MenuItems {
  return links.map(link => ({ key: link.key, label: <Link to={link.to}>{link.label}</Link> }));
}

/** v1's Settings popover: profile, Organization Settings, Sign Out, plus the theme switch the old header had. */
export function settingsMenuItems(account: HeaderAccount, theme: HeaderTheme): MenuItems {
  return [
    {
      key: 'user-profile',
      icon: (
        <Avatar size={24} src={account.avatarUrl || undefined}>
          {avatarInitial(account.displayName)}
        </Avatar>
      ),
      label: (
        <Link to={USER_PROFILE_PATH} className="block max-w-[200px] truncate">
          {account.displayName}
        </Link>
      )
    },
    { key: 'organization', label: <Link to={ORGANIZATION_SETTINGS_PATH}>Organization Settings</Link> },
    {
      key: DARK_MODE_KEY,
      label: (
        <span className="flex items-center justify-between gap-4">
          Dark mode
          {/* Display only: the menu click toggles, so the switch must not handle the click too. */}
          <Switch size="small" checked={theme.isDark} className="pointer-events-none" />
        </span>
      )
    },
    { key: SIGN_OUT_KEY, label: 'Sign Out', disabled: account.isLoggingOut }
  ];
}

/** Runs the settings item that is an action rather than a link. */
export function handleSettingsClick(key: string, account: HeaderAccount, theme: HeaderTheme): void {
  if (key === DARK_MODE_KEY) theme.onToggle();
  if (key === SIGN_OUT_KEY) account.onLogout();
}
