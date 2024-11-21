/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, DefaultSettings, ValueControlInfo, ValueControlType } from '@core/common/domain/model';
import { isArray } from 'lodash';

export interface SlicerOptionData extends ChartOptionData {
  from?: SlicerConfig;
  to?: SlicerConfig;
  default?: DefaultSettings;
  step?: number;
  dynamicSettings?: DynamicSetting;
}

export interface DynamicSetting {
  isNumber?: boolean;
}

export interface SlicerConfig {
  equal: boolean;
  value?: number;
}

export class SlicerFilterOption extends ChartOption<SlicerOptionData> {
  className = ChartOptionClassName.SlicerFilterSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): SlicerFilterOption {
    return new SlicerFilterOption(obj.options);
  }

  static getDefaultChartOption(): SlicerFilterOption {
    const textColor = this.getPrimaryTextColor();
    const options: SlicerOptionData = {
      title: ChartOption.getDefaultTitle({ title: 'Slicer', fontSize: '14px', align: 'left' }),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      textColor: textColor,
      activeColor: 'var(--tab-filter-background-active)',
      deActiveColor: 'var(--tab-filter-background-de-active)',
      background: this.getThemeBackgroundColor(),
      from: {
        equal: false
      },
      to: {
        equal: false,
        value: 1000000
      },
      default: {
        enabled: true,
        setting: void 0
      },
      step: 1,
      dynamicSettings: {
        isNumber: true
      }
    };
    return new SlicerFilterOption(options);
  }

  isEnableControl(): boolean {
    return true;
  }

  getSupportedControls(): ValueControlInfo[] {
    return [new ValueControlInfo(ValueControlType.MinValue, 'Start value'), new ValueControlInfo(ValueControlType.MaxValue, 'End value')];
  }

  getDefaultValueAsMap(): Map<ValueControlType, string[]> {
    const defaultValues = this.options.default?.setting?.value;
    if (isArray(defaultValues) && defaultValues.length === 2) {
      return new Map([
        [ValueControlType.MinValue, [defaultValues[0]]],
        [ValueControlType.MaxValue, [defaultValues[1]]]
      ]);
    } else {
      return new Map<ValueControlType, string[]>();
    }
  }

  getOverridePadding(): string | undefined {
    return '6px';
  }
}
