/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, ChartOptionData, VizSettingType } from '@core/domain/Model';

/**
 * @deprecated unused
 */
export class DropdownChartOption extends ChartOption {
  chartFamilyType = ChartFamilyType.Dropdown;
  className = VizSettingType.DropdownSetting;

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
