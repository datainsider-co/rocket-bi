import type { Dashboard } from '@/core/dashboard/Dashboard';
import { MainDateFilter } from '../controls/main-date/MainDateFilter';
import { ResetFiltersButton } from '../controls/ResetFiltersButton';
import type { DashboardLayout, DashboardPageState } from '../detail/DashboardPageView';
import { addMenuItems } from '../edit/editMenus.utils';
import { DashboardMode } from '../mode/dashboardMode.utils';
import { ViewAsBarView } from '../view-as/ViewAsBarView';
import { HeaderActionsView } from './HeaderActionsView';
import { optionItems, type DashboardOptionHandlers } from './headerOptions.utils';

interface DashboardControlBarProps {
  dashboard: Dashboard;
  state: DashboardPageState;
  layout: DashboardLayout;
  options: DashboardOptionHandlers;
}

/**
 * The header's right side (v1 `DashboardControlBar`): the main date filter (or Setup Main Date Filter in edit mode),
 * Reset Filters, View As, then the mode's buttons and its Options menu. Embedded, only the date and Reset Filters stay.
 */
export function DashboardControlBar({ dashboard, state, layout, options }: DashboardControlBarProps) {
  const { access, display, viewAs, editing } = state;
  const { mode, onModeChange } = display;
  const isEditing = editing.mode.editing;
  const items = optionItems(
    { mode, editing: isEditing, mobile: layout.mobile, canShare: access.permissions.canShare },
    {
      relationship: options.onRelationship && (() => options.onRelationship?.(dashboard, isEditing)),
      share: options.onShare && (() => options.onShare?.(dashboard)),
      settings: () => editing.dialogs.open({ kind: 'themes' }),
      fullscreen: () => onModeChange(DashboardMode.FullScreen),
      tv: () => onModeChange(DashboardMode.Tv),
      viewAs: viewAs.canViewAs ? viewAs.onOpen : undefined
    }
  );

  return (
    <>
      <MainDateFilter editing={isEditing && !layout.embedded ? editing.mainDate : undefined} />
      {!layout.mobile && <ResetFiltersButton />}
      {!layout.embedded && (
        <>
          {!isEditing && viewAs.user && <ViewAsBarView user={viewAs.user} onChange={viewAs.onOpen} onExit={viewAs.onExit} />}
          <HeaderActionsView
            mode={mode}
            editing={isEditing}
            options={items}
            edit={{
              canEdit: editing.canEdit && !viewAs.user,
              saving: editing.mode.saving,
              addItems: addMenuItems(editing.actions.add),
              onEdit: editing.mode.start,
              onSave: () => void editing.mode.save()
            }}
            onExitFullScreen={() => onModeChange(DashboardMode.View)}
          />
        </>
      )}
    </>
  );
}
