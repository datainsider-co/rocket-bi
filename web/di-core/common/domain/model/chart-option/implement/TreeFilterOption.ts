/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { TabOptionData, ChartOptionClassName } from '@core/common/domain/model';
import { ChartType, TabFilterDisplay } from '@/shared';

export class TreeFilterOption extends ChartOption<TabOptionData> {
  className = ChartOptionClassName.TreeFilterSetting;

  constructor(options: TabOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): TreeFilterOption {
    return new TreeFilterOption(obj.options);
  }

  static getDefaultChartOption(type: ChartType): TreeFilterOption {
    return new TreeFilterOption(this.getDefaultWidgetOptions(type));
  }

  private static getDefaultWidgetOptions(type: ChartType): TabOptionData {
    const textColor = this.getPrimaryTextColor();
    return {
      title: ChartOption.getDefaultTitle({ title: 'Tree Filter', fontSize: '14px', align: 'center' }),
      subtitle: ChartOption.getDefaultSubtitle(),
      displayAs: this.toDisplay(type),
      search: {
        enabled: false
      },
      affectedByFilter: true,
      textColor: textColor,
      activeColor: 'var(--tab-filter-background-active)',
      deActiveColor: '#9799AC',
      background: this.getThemeBackgroundColor(),
      default: {
        enabled: true,
        setting: {
          value: null
        }
      },
      choice: {
        borderColor: textColor,
        style: ChartOption.getSecondaryStyle()
      },
      switchColor: textColor
    };
  }

  private static toDisplay(chartType: ChartType): TabFilterDisplay {
    switch (chartType) {
      case ChartType.SingleTreeFilter:
        return TabFilterDisplay.SingleChoice;
      case ChartType.MultiTreeFilter:
        return TabFilterDisplay.MultiChoice;
      default:
        return TabFilterDisplay.MultiChoice;
    }
  }
}
