import type { MenuProps } from 'antd';

type MenuItems = NonNullable<MenuProps['items']>;

/** What a menu's item does when clicked, for a shortcut to it elsewhere; undefined when missing or disabled. */
export function menuAction(items: MenuItems, key: string): (() => void) | undefined {
  const item = items.find(candidate => candidate?.key === key);
  if (!item || !('onClick' in item) || typeof item.onClick !== 'function' || ('disabled' in item && item.disabled)) return undefined;
  // The menus here are built with handlers that take no argument (`editMenus.utils`, `tabEdit.utils`).
  const { onClick } = item as unknown as { onClick: () => void };
  return () => onClick();
}
