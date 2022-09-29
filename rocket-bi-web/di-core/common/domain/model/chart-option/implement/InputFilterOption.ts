/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, DefaultSettings, VizSettingType } from '@core/common/domain/model';
import { DateHistogramConditionTypes } from '@/shared';

export interface InputOptionData extends ChartOptionData {
  default?: DefaultSettings;
  placeHolder?: string;
}

export class InputFilterOption extends ChartOption<InputOptionData> {
  chartFamilyType = ChartFamilyType.TabFilter;
  className = VizSettingType.InputFilterSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): InputFilterOption {
    return new InputFilterOption(obj.options);
  }

  static getDefaultChartOption(): InputFilterOption {
    const textColor = this.getThemeTextColor();
    const options: ChartOptionData = {
      title: {
        align: 'left',
        enabled: true,
        text: 'Untitled chart',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '20px'
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
      placeHolder: 'Typing...',
      affectedByFilter: true,
      textColor: textColor,
      background: this.getThemeBackgroundColor()
    };
    return new InputFilterOption(options);
  }
}
