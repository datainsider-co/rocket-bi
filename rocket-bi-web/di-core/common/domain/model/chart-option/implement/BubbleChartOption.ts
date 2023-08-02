/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/common/domain/model';
import { toNumber } from 'lodash';

export class BubbleChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'xy'
    },
    // yAxis:{
    //   maxPadding:100
    // },
    yAxis: [
      {
        gridLineWidth: 0.5,
        gridLineColor: 'var(--grid-line-color)',
        tickLength: 0
        // gridLineDashStyle: 'longdash'
      }
    ],
    xAxis: [
      {
        maxPadding: 0,
        gridLineWidth: 0,
        gridLineColor: 'var(--grid-line-color)'
        // gridLineDashStyle: 'longdash'
      }
    ],
    // colorAxis: {
    //   maxColor: 'var(--heatmap-max)',
    //   minColor: 'var(--heatmap-min)',
    //   stops:[
    //     [0, '#3060cf'],
    //     [0.5, '#fffbbc'],
    //     [0.9, '#c4463a'],
    //     [1, '#c4463a']
    //   ]
    // }
    // plotOptions: {
    //   bubble: {
    //     opacity: 0.5
    //   }
    // }
    plotOptions: {
      bubble: {
        //     opacity: 0.5
        marker: {
          states: {
            hover: {
              lineWidth: 0
            }
          }
        }
      }
    }
  };
  chartFamilyType = ChartFamilyType.Bubble;
  className = VizSettingType.BubbleSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: BubbleChartOption): BubbleChartOption {
    return new BubbleChartOption(obj.options);
  }

  static getDefaultChartOption(): BubbleChartOption {
    const textColor: string = this.getThemeTextColor();
    const gridLineColor: string = this.getGridLineColor();
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
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
      affectedByFilter: true,
      background: this.getThemeBackgroundColor(),
      plotOptions: {
        series: {
          marker: {
            lineWidth: 0
          },
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
      numDataPoint: 1000,
      xAxis: [
        {
          visible: true,
          gridLineColor: gridLineColor,
          gridLineDashStyle: 'Solid',
          gridLineWidth: 0.5,
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
          gridLineColor: gridLineColor,
          gridLineDashStyle: 'Solid',
          gridLineWidth: 0.5,
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
    return new BubbleChartOption(options);
  }

  getNumDataPoint(): number | undefined {
    const numDataPoint: number = toNumber(this.options.numDataPoint);
    return isNaN(numDataPoint) ? void 0 : numDataPoint;
  }
}
