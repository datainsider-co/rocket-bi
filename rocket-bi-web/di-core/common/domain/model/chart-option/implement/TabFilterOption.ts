/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, StyleSetting, ValueControlInfo, ValueControlType } from '@core/common/domain/model';
import { ChartType, DefaultDynamicFunctionValue, DefaultFilterValue, Direction, TabFilterDisplay } from '@/shared';
import { Log } from '@core/utils';
import { isArray, isString } from 'lodash';
import { StringUtils } from '@/utils';

export interface DefaultSettings {
  enabled: boolean;
  setting?: DefaultFilterValue;
  dynamicFunction?: DefaultDynamicFunctionValue;
}

export interface SearchSetting {
  enabled: boolean;
  placeholder?: string;
}

export interface TabOptionData extends ChartOptionData {
  displayAs?: TabFilterDisplay;
  direction?: Direction;
  activeColor?: string;
  deActiveColor?: string;
  choiceActiveColor?: string;
  choiceDeActiveColor?: string;
  default?: DefaultSettings;
  search?: SearchSetting;
  choice?: { borderColor?: string; style?: StyleSetting };
  switchColor?: string;
}

export class TabFilterOption extends ChartOption<TabOptionData> {
  className = ChartOptionClassName.TabFilterSetting;

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
    const textColor = this.getPrimaryTextColor();
    return {
      title: ChartOption.getDefaultTitle({ fontSize: '14px' }),
      subtitle: ChartOption.getDefaultSubtitle(),
      displayAs: this.toDisplay(chartType),
      affectedByFilter: false,
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
    const textColor = this.getPrimaryTextColor();
    return {
      title: {
        align: 'center',
        enabled: false,
        text: '',
        style: {
          color: textColor,
          fontFamily: ChartOption.getPrimaryFontFamily(),
          fontWeight: ChartOption.getPrimaryFontWeight(),
          fontStyle: ChartOption.getPrimaryFontStyle(),
          fontSize: '20px'
        }
      },
      subtitle: {
        align: 'center',
        enabled: false,
        text: '',
        style: {
          color: textColor,
          fontFamily: ChartOption.getSecondaryFontFamily(),
          fontSize: '11px'
        }
      },
      displayAs: this.toDisplay(chartType),
      affectedByFilter: false,
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
      },
      search: {
        enabled: true,
        placeholder: 'Search...'
      }
    };
  }

  private static toDisplay(chartType: ChartType): TabFilterDisplay {
    switch (chartType) {
      case ChartType.SingleChoice:
      case ChartType.SingleChoiceFilter:
        return TabFilterDisplay.SingleChoice;
      case ChartType.MultiChoice:
      case ChartType.MultiChoiceFilter:
        return TabFilterDisplay.MultiChoice;
      case ChartType.DropDown:
      case ChartType.DropDownFilter:
        return TabFilterDisplay.DropDown;
      default:
        return TabFilterDisplay.Normal;
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

  isEnableControl(): boolean {
    return true;
  }

  getSupportedControls(): ValueControlInfo[] {
    return [new ValueControlInfo(ValueControlType.SelectedValue, 'Selected value')];
  }

  getDefaultValueAsMap(): Map<ValueControlType, string[]> | undefined {
    const defaultValue: any = this.options.default?.setting?.value;
    if (defaultValue && isArray(defaultValue)) {
      return new Map<ValueControlType, string[]>([[ValueControlType.SelectedValue, defaultValue]]);
    }
    if (defaultValue) {
      return new Map<ValueControlType, string[]>([[ValueControlType.SelectedValue, [defaultValue]]]);
    }
    return void 0;
  }

  getOverridePadding(): string | undefined {
    return '6px';
  }
}
