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

/** v1 `DashboardControlBar.items`: the icon of each Adding entry, by its key. */
const ADD_ICONS: Record<string, string> = {
  chart: 'di-icon-add-chart',
  tab: 'di-icon-add-tab',
  'filter-panel': 'di-icon-filter-panel',
  text: 'di-icon-add-text',
  image: 'di-icon-add-image',
  paste: 'di-icon-paste-chart'
};

function withIcons(items: HeaderEditActions['addItems']): HeaderEditActions['addItems'] {
  return items.map(item => {
    const icon = item && ADD_ICONS[String(item.key)];
    return item && icon ? { ...item, icon: <i className={icon} aria-hidden /> } : item;
  });
}

/**
 * The header's buttons per mode (v1 `DashboardControlBar`): Options and Edit in view mode; Adding, Options and Save in
 * edit mode; Options and the way out of full screen and TV mode. Keyed, so each set fades in when the mode changes.
 */
export function HeaderActionsView({ mode, editing, options, edit, onExitFullScreen }: HeaderActionsViewProps) {
  if (editing) {
    return (
      <div key="edit" className="dashboard-header__actions">
        <Dropdown
          trigger={['click']}
          menu={{ items: withIcons(edit.addItems) }}
          placement="bottomLeft"
          // v1: 9px under the button.
          align={{ offset: [0, 9] }}
          classNames={{ root: 'dashboard-context-menu' }}
          getPopupContainer={inDashboardPage}
        >
          <HeaderButton icon="di-icon-add" title="Adding" />
        </Dropdown>
        <DashboardOptionsMenuView items={options} />
        <HeaderButton icon="di-icon-save" title="Save" loading={edit.saving} onClick={edit.onSave} />
      </div>
    );
  }
  if (mode !== DashboardMode.View) {
    return (
      <div key="fullscreen" className="dashboard-header__actions">
        <DashboardOptionsMenuView items={options} />
        <button type="button" className="dashboard-header__icon-button" aria-label="Exit full screen" title="Exit full screen" onClick={onExitFullScreen}>
          <i className="di-icon-exit-full-screen" aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <div key="view" className="dashboard-header__actions">
      <DashboardOptionsMenuView items={options} />
      {edit.canEdit && <HeaderButton id="btn-edit-mode" icon="di-icon-edit" title="Edit" onClick={edit.onEdit} />}
    </div>
  );
}
