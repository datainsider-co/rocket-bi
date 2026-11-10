import { Dropdown, type MenuProps } from 'antd';
import type { TabItem } from '@/core/dashboard/Widget';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { WidgetMenuView } from '../menu/WidgetMenuView';

type MenuItems = NonNullable<MenuProps['items']>;

/** Edit mode menus of a tab widget: its own, behind a gear after the tabs, and each tab's, behind dots in its header. */
export interface TabMenus {
  widget: MenuItems;
  tab: (index: number) => MenuItems;
}

interface TabNavViewProps {
  tabs: readonly TabItem[];
  active: number;
  onActiveChange: (index: number) => void;
  /** Only in edit mode. */
  menus?: TabMenus;
}

/** v1 `TabViewer`: from this many tabs on, an arrow at the end of the header lists them. */
const TABS_WITH_SELECT = 3;

/** v1 `TabViewer`'s header: boxed tabs on the inactive background, the open one on the active background. */
export function TabNavView({ tabs, active, onActiveChange, menus }: TabNavViewProps) {
  return (
    <div className="tab-widget__nav" role="tablist">
      {tabs.map((tab, index) => (
        <div key={index} className="tab-widget__tab" data-active={index === active}>
          <button type="button" role="tab" aria-selected={index === active} className="tab-widget__title" onClick={() => onActiveChange(index)}>
            {tab.name}
          </button>
          {menus && <WidgetMenuView items={menus.tab(index)} label={`Actions of tab ${tab.name}`} trigger="more" size="small" />}
        </div>
      ))}
      {tabs.length >= TABS_WITH_SELECT && (
        <div className="tab-widget__tab tab-widget__end">
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            classNames={{ root: 'widget-menu' }}
            menu={{ items: tabs.map((tab, index) => ({ key: index, label: tab.name, onClick: () => onActiveChange(index) })), selectedKeys: [String(active)] }}
          >
            <button type="button" className={`tab-widget__select ${GRID_NO_DRAG_CLASS}`} aria-label="Select tab" title="Select tab">
              <i className="di-icon-arrow-down" aria-hidden />
            </button>
          </Dropdown>
        </div>
      )}
      {menus && (
        <div className="tab-widget__tab tab-widget__end">
          <WidgetMenuView items={menus.widget} label="Widget actions" trigger="setting" size="small" />
        </div>
      )}
    </div>
  );
}
