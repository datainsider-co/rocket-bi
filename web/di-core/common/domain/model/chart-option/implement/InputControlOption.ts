/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, InputOptionData } from '@core/common/domain/model';
import { ChartType } from '@/shared';

export class InputControlOption extends ChartOption<InputOptionData> {
  className = ChartOptionClassName.InputControlSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): InputControlOption {
    return new InputControlOption(obj.options);
  }

  static getDefaultChartOption(): InputControlOption {
    const textColor = this.getPrimaryTextColor();
    const options: ChartOptionData = {
      title: ChartOption.getDefaultTitle({ title: 'Input control', fontSize: '14px', align: 'left' }),
      subtitle: ChartOption.getDefaultSubtitle({ align: 'left' }),
      placeHolder: 'Typing...',
      chartType: ChartType.InputControl,
      affectedByFilter: true,
      textColor: textColor,
      background: this.getThemeBackgroundColor()
    };
    return new InputControlOption(options);
  }
}
