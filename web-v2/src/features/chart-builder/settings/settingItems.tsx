import type { ReactNode } from 'react';

interface SettingItem {
  key: string;
  label: string;
  children: ReactNode;
}

/** The tabs as collapse items, titled like v1's panel headers. */
export function settingItemsOf(items: readonly SettingItem[]) {
  return items.map(item => ({ ...item, label: <span className="text-xs font-semibold uppercase">{item.label}</span> }));
}
