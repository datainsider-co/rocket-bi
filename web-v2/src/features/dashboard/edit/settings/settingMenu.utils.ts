import { AUTO_REFRESH_OPTIONS } from './dashboardSettings.utils';

/** What the gear's menu does. */
export interface SettingMenuHandlers {
  onEditDashboard: () => void;
  onEditWidgets: () => void;
  onThemes: () => void;
  /** 0 turns auto refresh off. */
  onAutoRefresh: (intervalMs: number) => void;
}

export interface SettingMenuItem {
  key: string;
  label: string;
  /** A v1 icon font class; the refresh intervals have none. */
  icon?: string;
  /** The current refresh interval gets a check. */
  active?: boolean;
  onSelect?: () => void;
  children?: readonly SettingMenuItem[];
}

/**
 * The menu of the gear at the dashboard's top right in edit mode (v1 `DashboardDetail.onClickDashboardSetting`): Edit
 * Dashboard, Edit Widgets, Themes and Auto Refresh Data with its intervals, the current one checked.
 */
export function settingMenuItems(autoRefreshMs: number, handlers: SettingMenuHandlers): SettingMenuItem[] {
  return [
    { key: 'editDashboard', label: 'Edit Dashboard', icon: 'di-icon-edit-dashboard', onSelect: handlers.onEditDashboard },
    { key: 'editWidgets', label: 'Edit Widgets', icon: 'di-icon-outline-edit', onSelect: handlers.onEditWidgets },
    { key: 'themes', label: 'Themes', icon: 'di-icon-image', onSelect: handlers.onThemes },
    {
      key: 'autoRefresh',
      label: 'Auto Refresh Data',
      icon: 'di-icon-refresh',
      children: AUTO_REFRESH_OPTIONS.map(({ value, label }) => ({
        key: `autoRefresh:${value}`,
        label,
        active: value === autoRefreshMs,
        onSelect: () => handlers.onAutoRefresh(value)
      }))
    }
  ];
}
