/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, TabOptionData, VizSettingType } from '@core/common/domain/model';
import { ChartType, TabFilterDisplay } from '@/shared';

export class TreeFilterOption extends ChartOption<TabOptionData> {
  chartFamilyType = ChartFamilyType.TreeFilter;
  className = VizSettingType.TreeFilterSetting;

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
    const textColor = this.getThemeTextColor();
    return {
      title: {
        align: 'center',
        enabled: true,
        text: 'Tree Filter',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '14px'
        }
      },
      displayAs: this.toDisplay(type),
      subtitle: {
        align: 'center',
        enabled: true,
        text: '',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '11px'
        }
      },
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
        style: {
          color: textColor,
          fontSize: '12px',
          fontFamily: 'Roboto'
        }
      },
      switchColor: textColor
    };
  }

  private static toDisplay(chartType: ChartType): TabFilterDisplay {
    switch (chartType) {
      case ChartType.SingleTreeFilter:
        return TabFilterDisplay.singleChoice;
      case ChartType.MultiTreeFilter:
        return TabFilterDisplay.multiChoice;
      default:
        return TabFilterDisplay.multiChoice;
    }
  }
}
