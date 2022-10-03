/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { AxisSetting, ChartFamilyType, ChartOptionData, VizSettingType } from '@core/common/domain/model';
import { toNumber } from 'lodash';
import { PlotOptions } from '@core/common/domain/model/chart-option/extra-setting/chart-style/PlotOptions';

export interface GaugeOptionData extends ChartOptionData {
  xAxis?: AxisSetting;
  yAxis?: AxisSetting;
  plotOptions?: PlotOptions;
}

export class GaugeChartOption extends ChartOption<GaugeOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      type: 'solidgauge',
      plotBackgroundColor: null,
      plotBackgroundImage: null,
      plotBorderWidth: 0,
      plotShadow: false
    },
    pane: {
      center: ['50%', '85%'],
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: '#DDD',
        borderWidth: 1,
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc'
      }
    },
    yAxis: {
      stops: [
        [0.1, '#34DA0B'], // green
        [0.5, '#FFAC05'], // yellow
        [0.9, '#FF5151'] // red
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      title: {
        y: -70
      },
      labels: {
        y: 16
      }
    },
    plotOptions: {
      solidgauge: {
        enabled: false,
        dataLabels: {
          borderWidth: 0,
          enabled: true
        }
      },
      gauge: {
        pivot: {
          backgroundColor: '#00000000'
        },
        dial: {
          baseLength: '100%',
          radius: '105%',
          rearLength: '-50%',
          enableMouseTracking: false
        }
      }
    }
  };
  chartFamilyType = ChartFamilyType.Gauge;
  className = VizSettingType.GaugeSetting;

  constructor(options: ChartOptionData = {}) {
    super({ ...options, yAxis: { ...options.yAxis, min: toNumber(options.yAxis.min) } });
  }

  static fromObject(obj: GaugeChartOption): GaugeChartOption {
    return new GaugeChartOption(obj.options);
  }

  static getDefaultChartOption(): GaugeChartOption {
    const textColor: string = this.getThemeTextColor();
    const options: GaugeOptionData = {
      title: {
        align: 'center',
        enabled: true,
        text: 'Untitled chart',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '20px'
        }
      },
      subtitle: {
        align: 'center',
        enabled: true,
        text: '',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '11px'
        }
      },
      affectedByFilter: true,
      background: this.getThemeBackgroundColor(),
      plotOptions: {
        solidgauge: {
          dataLabels: {
            enabled: true,
            style: {
              color: textColor,
              fontSize: '24px',
              fontFamily: 'Roboto',
              textOutline: 0
            }
          }
        },
        gauge: {
          dial: {
            backgroundColor: '#2187FF'
          }
        }
      },
      yAxis: {
        visible: true,
        min: 0,
        max: 10000,
        labels: {
          style: {
            color: textColor,
            fontFamily: 'Roboto',
            textOutline: 0,
            fontSize: '10px'
          }
        },
        stops: [
          [0.1, '#34DA0B'], // green
          [0.5, '#FFAC05'], // yellow
          [0.9, '#FF5151'] // red
        ]
      },
      target: 0,
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      }
    };
    return new GaugeChartOption(options);
  }
}
