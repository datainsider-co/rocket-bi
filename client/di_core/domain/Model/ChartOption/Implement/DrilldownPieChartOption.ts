/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, ChartOptionData, VizSettingType } from '@core/domain/Model';

/**
 * @deprecated from v1.0.0
 */
export class DrilldownPieChartOption extends ChartOption {
  static readonly DEFAULT_SETTING = {
    plotOptions: {
      pie: {
        borderWidth: 0,
        borderColor: 'black',
        dataLabels: {
          useHTML: true,
          style: {
            border: '0px',
            borderColor: 'none',
            textShadow: false
          }
        }
      }
    }
  };
  chartFamilyType = ChartFamilyType.DrilldownPie;
  className = VizSettingType.DrilldownPieSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: DrilldownPieChartOption): DrilldownPieChartOption {
    return new DrilldownPieChartOption(obj.options);
  }

  static getDefaultChartOption(): DrilldownPieChartOption {
    return new DrilldownPieChartOption();
  }
}
