import { useMemo } from 'react';
import { App } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { EditDialog } from '../editDialogs';
import type { DashboardEditor } from '../useDashboardEditor';
import { autoRefreshOf, errorMessage, settingDraft, withAutoRefresh } from './dashboardSettings.utils';
import { settingMenuItems, type SettingMenuItem } from './settingMenu.utils';

/**
 * The gear's menu in edit mode (v1 `DashboardDetail.onClickDashboardSetting`): its items open the settings dialogs, and
 * an auto refresh interval is saved as soon as it is picked (v1 `selectRefreshInterval`).
 */
export function useSettingMenu(dashboard: Dashboard | undefined, editor: DashboardEditor, openDialog: (dialog: EditDialog) => void): SettingMenuItem[] {
  const { message } = App.useApp();
  return useMemo(() => {
    if (!dashboard) return [];
    const draft = settingDraft(dashboard);
    return settingMenuItems(autoRefreshOf(draft), {
      onEditDashboard: () => openDialog({ kind: 'editDashboard' }),
      onEditWidgets: () => openDialog({ kind: 'editWidgets' }),
      onThemes: () => openDialog({ kind: 'themes' }),
      onAutoRefresh: intervalMs => {
        editor.saveSetting(withAutoRefresh(draft, intervalMs)).catch((error: unknown) => void message.error(errorMessage(error)));
      }
    });
  }, [dashboard, editor, openDialog, message]);
}
