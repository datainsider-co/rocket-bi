/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, SeriesOptionData } from '@core/common/domain/model';

export class HeatMapChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    boost: {
      useGPUTranslations: true
    },
    colorAxis: {
      min: null,
      minColor: '#FFAC05',
      maxColor: '#F2E8D6'
    },
    plotOptions: {
      heatmap: {
        nullColor: '#e8e8f5',
        borderWidth: 0.5
      }
    },
    yAxis: {
      tickLength: 0
    }
  };

  className = ChartOptionClassName.HeatMapSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: HeatMapChartOption): HeatMapChartOption {
    return new HeatMapChartOption(obj.options);
  }

  static getDefaultChartOption(): HeatMapChartOption {
    const textColor: string = this.getPrimaryTextColor();
    const options: SeriesOptionData = {
      legend: {
        enabled: true,
        verticalAlign: 'bottom',
        layout: 'horizontal',
        title: {
          text: '',
          enabled: true
        }
      },
      colorAxis: {
        minColor: '#D4DDFD',
        maxColor: '#4E73F8',
        noneColor: '#F2E8D6',
        labels: {
          style: {
            color: '#808491',
            fontSize: '14px'
          }
        }
      },
      title: ChartOption.getDefaultTitle({ align: 'left', fontSize: '16px' }),
      subtitle: ChartOption.getDefaultSubtitle({ align: 'left', fontSize: '14px' }),
      affectedByFilter: true,
      background: this.getThemeBackgroundColor(),
      plotOptions: {
        heatmap: {
          // lineWidth: 2,
          // dashStyle: 'Solid',
          // marker: {
          //   enabled: true
          // },
          pointPadding: 1,
          borderRadius: 3,
          borderWidth: 0,
          dataLabels: {
            enabled: false,
            style: {
              ...ChartOption.getSecondaryStyle(),
              fontSize: '11px'
            }
          }
        }
      },
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
      },
      xAxis: [
        {
          visible: true,
          lineColor: 'transparent',
          gridLineColor: 'transparent',
          labels: {
            style: {
              color: '#808491',
              fontSize: '14px'
            }
          },
          title: {
            style: {
              color: textColor,
              fontSize: '14px'
            },
            text: '',
            enabled: true
          }
        }
      ],
      yAxis: [
        {
          visible: true,
          gridLineColor: 'transparent',
          labels: {
            style: {
              color: '#808491',
              fontSize: '14px'
            }
          },
          title: {
            style: {
              color: textColor
            },
            text: '',
            enabled: true
          }
        }
      ]
    };

    return new HeatMapChartOption(options);
  }
}
