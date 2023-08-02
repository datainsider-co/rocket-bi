/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, DefaultSettings, InputOptionData, VizSettingType } from '@core/common/domain/model';
import { ChartType, DateHistogramConditionTypes } from '@/shared';

export class InputControlOption extends ChartOption<InputOptionData> {
  chartFamilyType = ChartFamilyType.TabFilter;
  className = VizSettingType.InputControlSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): InputControlOption {
    return new InputControlOption(obj.options);
  }

  static getDefaultChartOption(): InputControlOption {
    const textColor = this.getThemeTextColor();
    const options: ChartOptionData = {
      title: {
        align: 'left',
        enabled: true,
        text: 'Input control',
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
      placeHolder: 'Typing...',
      chartType: ChartType.InputControl,
      affectedByFilter: true,
      textColor: textColor,
      background: this.getThemeBackgroundColor()
    };
    return new InputControlOption(options);
  }
}
