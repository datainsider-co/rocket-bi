import { Tab, TabWidget, TabWidgetOptions } from './TabWidget';
import { ChartType } from '@/shared';
import { Widget, Widgets } from '@core/common/domain';

export class GroupFilter extends TabWidget {
  static fromObject(obj: GroupFilter): GroupFilter {
    const tabs = obj.tabItems ? obj.tabItems.map(tab => Tab.fromObject(tab)) : [];
    return new GroupFilter(obj, tabs, obj.extraData);
  }

  static empty() {
    return new GroupFilter(
      {
        id: -1,
        name: '',
        description: '',
        textColor: 'var(--text-color)'
        // background: ''
      },
      [Tab.new('Filter panel')],
      GroupFilter.defaultSetting()
    );
  }

  static defaultSetting(): TabWidgetOptions {
    return {
      configs: {} as any,
      filters: {} as any,
      currentChartType: ChartType.FilterPanel,
      header: {
        position: 'horizontal',
        fontFamily: 'Roboto',
        color: 'var(--text-color)',
        fontSize: '14px',
        active: {
          background: 'var(--chart-background-color)'
        },
        inActive: {
          background: 'var(--tab-widget-background-deactive)'
        }
      },
      footer: {
        align: 'right',
        apply: {
          fontFamily: 'Roboto',
          fontSize: '14px',
          title: 'Apply',
          color: 'var(--accent-text-color)',
          background: 'var(--accent)'
        }
      }
    };
  }

  static isGroupFilter(widget: Widget | null | undefined): widget is GroupFilter {
    return TabWidget.isTabWidget(widget) && widget.extraData?.currentChartType === ChartType.FilterPanel;
  }
}
