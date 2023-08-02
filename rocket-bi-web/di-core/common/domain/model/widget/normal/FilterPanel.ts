import { Tab, TabWidget, TabWidgetOptions } from './TabWidget';
import { ChartType } from '@/shared';
import { Widget, Widgets } from '@core/common/domain';

export class FilterPanel extends TabWidget {
  static fromObject(obj: FilterPanel): FilterPanel {
    const tabs = obj.tabItems ? obj.tabItems.map(tab => Tab.fromObject(tab)) : [];
    return new FilterPanel(obj, tabs, obj.extraData);
  }

  static empty() {
    return new FilterPanel(
      {
        id: -1,
        name: '',
        description: '',
        textColor: 'var(--text-color)'
        // background: ''
      },
      [Tab.new('Filter panel')],
      FilterPanel.defaultSetting()
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

  static isFilterPanel(widget: Widget | null | undefined): widget is FilterPanel {
    return TabWidget.isTabWidget(widget) && widget.extraData?.currentChartType === ChartType.FilterPanel;
  }
}
