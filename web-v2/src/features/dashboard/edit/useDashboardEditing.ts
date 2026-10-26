import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { DashboardPermissions } from '../access/access.utils';
import type { ChartBuilderBridge } from './chartBuilderBridge';
import { useDashboardEditor } from './useDashboardEditor';
import { useEditDialogs } from './useEditDialogs';
import { useEditMode } from './useEditMode';
import { useLeaveGuard } from './useLeaveGuard';
import { useWidgetEditActions } from './useWidgetEditActions';

interface DashboardEditingInput {
  dashboard: Dashboard | undefined;
  permissions: DashboardPermissions;
  /** Edit mode exists on desktop, outside the embedded page (v1). */
  available: boolean;
  chartBuilder?: ChartBuilderBridge;
}

/** Everything edit mode needs on the dashboard page. */
export function useDashboardEditing({ dashboard, permissions, available, chartBuilder }: DashboardEditingInput) {
  const editor = useDashboardEditor(dashboard?.id ?? 0);
  const mode = useEditMode(dashboard, dashboard && editor);
  const dialogs = useEditDialogs(editor, mode.release);
  const actions = useWidgetEditActions({ dashboard: mode.shown, editor, editing: mode.editing, openDialog: dialogs.open, release: mode.release, chartBuilder });
  useLeaveGuard(mode.editing, mode.dirty, dashboard?.id);
  return { canEdit: available && permissions.canEdit, mode, dialogs, actions };
}

export type DashboardEditing = ReturnType<typeof useDashboardEditing>;
