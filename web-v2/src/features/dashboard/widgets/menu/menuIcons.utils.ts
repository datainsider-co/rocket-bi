/**
 * v1's icon for each widget menu item, by the item's key (v1 `ActionWidgetMore`, `OtherWidget`, `TabViewer`,
 * `FilterPanelViewer` menus). Classes of the data-insider icon font.
 */
const MENU_ICONS: Readonly<Record<string, string>> = {
  rename: 'di-icon-under-text',
  config: 'di-icon-add-chart',
  'edit-text': 'di-icon-under-text',
  'replace-image': 'di-icon-image',
  copy: 'di-icon-copy-2',
  duplicate: 'di-icon-duplicate',
  delete: 'di-icon-delete',
  'add-tab': 'di-icon-add-tab',
  sort: 'di-icon-funnel-analysis',
  'config-tab': 'di-icon-config',
  'config-panel': 'di-icon-setting',
  'rename-tab': 'di-icon-under-text',
  'add-widgets': 'di-icon-add-chart',
  'remove-widgets': 'di-icon-close',
  'add-filters': 'di-icon-add',
  'remove-filters': 'di-icon-delete',
  'delete-tab': 'di-icon-delete'
};

/** The icon class of a menu item, or undefined for items v1 showed without one. */
export function menuIconClass(key: string): string | undefined {
  return MENU_ICONS[key];
}
