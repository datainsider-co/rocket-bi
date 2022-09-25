/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, TabOptionData, VizSettingType } from '@core/domain/Model';
import { ChartType, TabFilterDisplay } from '@/shared';

export class GroupMeasurementOption extends ChartOption<TabOptionData> {
  chartFamilyType = ChartFamilyType.TabFilter;
  className = VizSettingType.TabMeasurementSetting;

  constructor(options: TabOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): GroupMeasurementOption {
    return new GroupMeasurementOption(obj.options);
  }

  static getDefaultChartOption(chartType: ChartType): GroupMeasurementOption {
    const isFilterWidget = this.isFilterWidget(chartType);
    const options = isFilterWidget ? this.getDefaultWidgetOptions(chartType) : this.getDefaultInnerFilterOptions(chartType);
    return new GroupMeasurementOption(options);
  }

  private static getDefaultWidgetOptions(chartType: ChartType): TabOptionData {
    const textColor = this.getThemeTextColor();
    return {
      title: {
        align: 'center',
        enabled: true,
        text: 'Tab Control',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '20px'
        }
      },
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
      displayAs: this.toDisplay(chartType),
      affectedByFilter: true,
      textColor: textColor,
      activeColor: 'var(--tab-filter-background-active)',
      deActiveColor: 'var(--tab-filter-background-de-active)',
      background: this.getThemeBackgroundColor(),
      default: {
        enabled: true,
        dynamicFunction: {
          values: [0]
        }
      }
    };
  }

  private static getDefaultInnerFilterOptions(chartType: ChartType): TabOptionData {
    const textColor = this.getThemeTextColor();
    return {
      title: {
        align: 'center',
        enabled: false,
        text: 'Tab Control',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '20px'
        }
      },
      subtitle: {
        align: 'center',
        enabled: false,
        text: '',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '11px'
        }
      },
      displayAs: this.toDisplay(chartType),
      affectedByFilter: true,
      textColor: textColor,
      activeColor: 'var(--tab-filter-background-active)',
      deActiveColor: 'var(--tab-filter-background-de-active)',
      background: this.getThemeBackgroundColor(),
      default: {
        enabled: true,
        setting: {
          value: null
        }
      }
    };
  }

  private static toDisplay(chartType: ChartType): TabFilterDisplay {
    switch (chartType) {
      case ChartType.SingleChoice:
      case ChartType.SingleChoiceFilter:
      case ChartType.SingleChoiceMeasurement:
        return TabFilterDisplay.singleChoice;
      case ChartType.MultiChoice:
      case ChartType.MultiChoiceFilter:
      case ChartType.MultiChoiceMeasurement:
        return TabFilterDisplay.multiChoice;
      case ChartType.DropDown:
      case ChartType.DropDownFilter:
      case ChartType.DropDownMeasurement:
        return TabFilterDisplay.dropDown;
      default:
        return TabFilterDisplay.normal;
    }
  }

  private static isFilterWidget(chartType: ChartType) {
    switch (chartType) {
      case ChartType.TabMeasurement:
      case ChartType.DropDownMeasurement:
      case ChartType.SingleChoiceMeasurement:
      case ChartType.MultiChoiceMeasurement:
        return true;
      default:
        return false;
    }
  }
}
