/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, ChartOptionData, VizSettingType } from '@core/domain/Model';
import { ChartType, DefaultDynamicFunctionValue, DefaultFilterValue, Direction, TabFilterDisplay } from '@/shared';
import { Log } from '@core/utils';

export interface DefaultSettings {
  enabled: boolean;
  setting?: DefaultFilterValue;
  dynamicFunction?: DefaultDynamicFunctionValue;
}

export interface TabOptionData extends ChartOptionData {
  displayAs?: TabFilterDisplay;
  direction?: Direction;
  activeColor?: string;
  deActiveColor?: string;
  choiceActiveColor?: string;
  choiceDeActiveColor?: string;
  default?: DefaultSettings;
}

export class TabFilterOption extends ChartOption<TabOptionData> {
  chartFamilyType = ChartFamilyType.TabFilter;
  className = VizSettingType.TabFilterSetting;

  constructor(options: TabOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): TabFilterOption {
    return new TabFilterOption(obj.options);
  }

  static getDefaultChartOption(chartType: ChartType): TabFilterOption {
    const isFilterWidget = this.isFilterWidget(chartType);
    const options = isFilterWidget ? this.getDefaultWidgetOptions(chartType) : this.getDefaultInnerFilterOptions(chartType);
    Log.debug('TabFilterOption::getDefaultChartOption::isFilterWidget', chartType, isFilterWidget);
    Log.debug('TabFilterOption::getDefaultWidgetOptions', options);
    return new TabFilterOption(options);
  }

  private static getDefaultWidgetOptions(chartType: ChartType): TabOptionData {
    const textColor = this.getThemeTextColor();
    return {
      title: {
        align: 'center',
        enabled: true,
        text: 'Tab',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '14px'
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
        setting: {
          value: null
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
        text: '',
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
      choiceActiveColor: 'var(--choice-filter-background-active)',
      choiceDeActiveColor: 'var(--choice-filter-background-de-active)',
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
        return TabFilterDisplay.singleChoice;
      case ChartType.MultiChoice:
      case ChartType.MultiChoiceFilter:
        return TabFilterDisplay.multiChoice;
      case ChartType.DropDown:
      case ChartType.DropDownFilter:
        return TabFilterDisplay.dropDown;
      default:
        return TabFilterDisplay.normal;
    }
  }

  private static isFilterWidget(chartType: ChartType) {
    switch (chartType) {
      case ChartType.SingleChoice:
      case ChartType.MultiChoice:
      case ChartType.DropDown:
      case ChartType.TabFilter:
        return true;
      default:
        return false;
    }
  }
}
