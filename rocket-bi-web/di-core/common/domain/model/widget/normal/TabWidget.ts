import { ListUtils } from '@/utils';
import { DIMap, Position, TabId, GroupFilter, WidgetCommonData, WidgetExtraData, WidgetId, Widgets } from '@core/common/domain/model';
import { Widget } from '../Widget';

export class Tab {
  name: string;
  widgetIds: WidgetId[];
  options: any;

  constructor(name: string, widgets: WidgetId[], options?: any) {
    this.name = name;
    this.widgetIds = widgets;
    this.options = options || {};
  }

  static fromObject(obj: Tab): Tab {
    return new Tab(obj.name, obj.widgetIds, obj.options);
  }

  static new(name: string): Tab {
    return new Tab(name, []);
  }

  addWidgets(widgetIds: WidgetId[]) {
    this.widgetIds.push(...widgetIds);
  }

  removeWidgets(ids: WidgetId[]) {
    this.widgetIds = this.widgetIds.filter(widgetId => !ids.includes(widgetId));
  }
}

export interface TabWidgetOptions extends WidgetExtraData {
  header?: HeaderSetting;
  footer?: FooterSetting;
}

export interface HeaderSetting {
  position?: 'vertical' | 'horizontal';
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  active?: {
    background?: string;
  };
  inActive?: {
    background?: string;
  };
}

export interface FooterSetting {
  align?: 'left' | 'right' | 'center';
  apply?: {
    background?: string;
    title?: string;
    color?: string;
    fontFamily?: string;
    fontSize?: string;
  };
}

export class TabWidget extends Widget {
  className = Widgets.Tab;
  tabItems: Tab[];
  extraData?: TabWidgetOptions;

  constructor(commonSetting: WidgetCommonData, tabs: Tab[], extraData?: TabWidgetOptions) {
    super(commonSetting);
    this.tabItems = tabs;
    this.extraData = extraData;
  }

  addTab(name: string): TabWidget {
    this.tabItems.push(Tab.new(name));
    return this;
  }

  removeTab(index: number): TabWidget {
    this.tabItems = ListUtils.removeAt(this.tabItems, index);
    return this;
  }

  static empty() {
    return new TabWidget(
      {
        id: -1,
        name: '',
        description: '',
        textColor: 'var(--text-color)'
        // background: ''
      },
      [Tab.new('New tab')],
      TabWidget.defaultSetting()
    );
  }

  static defaultSetting(): TabWidgetOptions {
    return {
      configs: {} as any,
      filters: {} as any,
      currentChartType: '',
      header: {
        position: 'horizontal',
        fontFamily: 'Roboto',
        color: 'var(--text-color)',
        fontSize: '14px',
        active: {
          background: 'var(--tab-widget-background-active)'
        },
        inActive: {
          background: 'var(--tab-widget-background-deactive)'
        }
      }
    };
  }

  static fromObject(obj: TabWidget): TabWidget {
    if (GroupFilter.isGroupFilter(obj)) {
      return GroupFilter.fromObject(obj);
    } else {
      const tabs = (obj as TabWidget).tabItems ? (obj as TabWidget).tabItems.map(tab => Tab.fromObject(tab)) : [];
      return new TabWidget(obj, tabs, (obj as TabWidget).extraData);
    }
  }

  getTab(index: number): Tab {
    return this.tabItems![index];
  }

  /***
   Key: index of Tab

   Value: List id of Widget in Tab

   Example:
   {
    0: [1,2,3],
    1: [4],
    2: []
  }
   ***/
  get tabAsMap(): Map<number, WidgetId[]> {
    return new Map(this.tabItems.map((tab, index) => [index, tab.widgetIds]));
  }

  get allWidgets(): WidgetId[] {
    return this.tabItems.flatMap(tab => tab.widgetIds);
  }

  static isTabWidget(widget: Widget | null | undefined): widget is TabWidget {
    return widget?.className === Widgets.Tab;
  }

  /*
   * Output: trả về index của tab chứa widget
   * VD:
   * Tab 0: [1,2,3]
   * Tab 1: [4,5,6]
   * Tab 2: [1]
   * Input: 1
   * Output: [0, 2]
   * */
  findWidget(id: WidgetId): number[] {
    const result: number[] = [];
    this.tabItems.forEach((tab, index) => {
      if (tab.widgetIds.includes(id)) {
        result.push(index);
      }
    });
    return result;
  }

  removeWidgetId(id: WidgetId): TabWidget {
    const indexesTab: number[] = this.findWidget(id);
    for (const index of indexesTab) {
      this.getTab(index).removeWidgets([id]);
    }
    return this;
  }

  getDefaultPosition(): Position {
    return new Position(-1, -1, 24, 16, 1);
  }
}
