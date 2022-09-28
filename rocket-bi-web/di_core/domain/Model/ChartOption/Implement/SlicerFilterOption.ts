/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, ChartOptionData, DefaultSettings, VizSettingType } from '@core/domain/Model';

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
  chartFamilyType = ChartFamilyType.TabFilter;
  className = VizSettingType.SlicerFilterSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): SlicerFilterOption {
    return new SlicerFilterOption(obj.options);
  }

  static getDefaultChartOption(): SlicerFilterOption {
    const textColor = this.getThemeTextColor();
    const options: SlicerOptionData = {
      title: {
        align: 'left',
        enabled: true,
        text: 'Slicer',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '14px'
        }
      },
      subtitle: {
        align: 'left',
        enabled: true,
        text: '',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '11px'
        }
      },
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
}
