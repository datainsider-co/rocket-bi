/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, SeriesOptionData, ChartOptionData, VizSettingType } from '@core/domain/Model';

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
  chartFamilyType = ChartFamilyType.HeatMap;
  className = VizSettingType.HeatMapSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: HeatMapChartOption): HeatMapChartOption {
    return new HeatMapChartOption(obj.options);
  }

  static getDefaultChartOption(): HeatMapChartOption {
    const textColor: string = this.getThemeTextColor();
    const options: SeriesOptionData = {
      legend: {
        enabled: true,
        verticalAlign: 'bottom',
        layout: 'horizontal',
        itemStyle: {
          color: textColor
        },
        title: {
          text: '',
          enabled: true,
          style: {
            color: textColor
          }
        }
      },
      colorAxis: {
        minColor: '#F2E8D6',
        maxColor: '#FFAC05',
        noneColor: '#F2E8D6'
      },
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
        heatmap: {
          // lineWidth: 2,
          // dashStyle: 'Solid',
          // marker: {
          //   enabled: true
          // },
          dataLabels: {
            enabled: false,
            style: {
              color: textColor,
              fontSize: '11px',
              fontFamily: 'Roboto'
            }
          }
        }
      },
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
      xAxis: [
        {
          visible: true,
          labels: {
            style: {
              color: textColor
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
      ],
      yAxis: [
        {
          visible: true,
          labels: {
            style: {
              color: textColor
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
