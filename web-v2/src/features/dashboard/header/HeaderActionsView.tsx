import { Dropdown, type MenuProps } from 'antd';
import { DashboardMode } from '../mode/dashboardMode.utils';
import { inDashboardPage } from '../theme/popupContainer';
import { DashboardOptionsMenuView } from './DashboardOptionsMenuView';
import { HeaderButton } from './HeaderButton';
import type { OptionItem } from './headerOptions.utils';

export interface HeaderEditActions {
  canEdit: boolean;
  saving: boolean;
  addItems: NonNullable<MenuProps['items']>;
  onEdit: () => void;
  onSave: () => void;
}

interface HeaderActionsViewProps {
  mode: DashboardMode;
  editing: boolean;
  options: readonly OptionItem[];
  edit: HeaderEditActions;
  onExitFullScreen: () => void;
}

/**
 * The header's buttons per mode (v1 `DashboardControlBar`): Options and Edit in view mode; Adding, Options and Save in
 * edit mode; Options and the way out of full screen and TV mode.
 */
export function HeaderActionsView({ mode, editing, options, edit, onExitFullScreen }: HeaderActionsViewProps) {
  if (editing) {
    return (
      <>
        <Dropdown trigger={['click']} menu={{ items: edit.addItems }} placement="bottomRight" getPopupContainer={inDashboardPage}>
          <HeaderButton icon="di-icon-add" title="Adding" />
        </Dropdown>
        <DashboardOptionsMenuView items={options} />
        <HeaderButton icon="di-icon-save" title="Save" loading={edit.saving} onClick={edit.onSave} />
      </>
    );
  }
  if (mode !== DashboardMode.View) {
    return (
      <>
        <DashboardOptionsMenuView items={options} />
        <button type="button" className="dashboard-header__icon-button" aria-label="Exit full screen" title="Exit full screen" onClick={onExitFullScreen}>
          <i className="di-icon-exit-full-screen" aria-hidden />
        </button>
      </>
    );
  }
  return (
    <>
      <DashboardOptionsMenuView items={options} />
      {edit.canEdit && <HeaderButton id="btn-edit-mode" icon="di-icon-edit" title="Edit" onClick={edit.onEdit} />}
    </>
  );
}
