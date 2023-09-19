/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, ChartOptionClassName } from '@core/common/domain/model';

/**
 * @deprecated unused
 */
export class DropdownChartOption extends ChartOption {
  className = ChartOptionClassName.DropdownSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): DropdownChartOption {
    return new DropdownChartOption(obj.options);
  }

  static getDefaultChartOption(): DropdownChartOption {
    return new DropdownChartOption();
  }
}
