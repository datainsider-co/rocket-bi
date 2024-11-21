/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import Highcharts from 'highcharts/highmaps';
import { ChartOptionData, ChartOptionClassName } from '@core/common/domain/model';

/**
 * @deprecated from v1.0.
 */
export class DrilldownChartOption extends ChartOption {
  static readonly DEFAULT_SETTING: Highcharts.Options = {
    yAxis: {
      gridLineWidth: 0.5,
      gridLineColor: 'var(--grid-line-color)',
      tickLength: 0
      // gridLineDashStyle: 'longdash'
    },
    xAxis: {
      lineWidth: 0.5
    },
    plotOptions: {
      series: {
        //todo trick to compile
        threshold: null as any,
        borderWidth: 0,
        dataLabels: {
          color: '#fff',
          useHTML: true,
          style: {
            border: '0px',
            textShadow: false,
            borderColor: 'none'
          }
        }
      }
    }
  };

  className = ChartOptionClassName.DrilldownSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: DrilldownChartOption): DrilldownChartOption {
    return new DrilldownChartOption(obj.options);
  }

  static getDefaultChartOption(): DrilldownChartOption {
    return new DrilldownChartOption();
  }
}
