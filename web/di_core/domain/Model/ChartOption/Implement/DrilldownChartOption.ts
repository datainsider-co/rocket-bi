/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import Highcharts from 'highcharts/highmaps';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ChartFamilyType, ChartOptionData, VizSettingType } from '@core/domain/Model';

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
  chartFamilyType = ChartFamilyType.Drilldown;
  className = VizSettingType.DrilldownSetting;

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
