/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';
import { toNumber } from 'lodash';

export class ScatterChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'xy'
    },
    yAxis: [
      {
        gridLineWidth: 0.5,
        gridLineColor: 'var(--grid-line-color)',
        tickLength: 0
        // gridLineDashStyle: 'longdash'
      }
    ],
    xAxis: {
      gridLineWidth: 0.5,
      lineWidth: 0.5,
      gridLineColor: 'var(--grid-line-color)',
      // gridLineDashStyle: 'longdash'
      startOnTick: true,
      endOnTick: true,
      showLastLabel: true
    },
    plotOptions: {
      scatter: {
        tooltip: {
          headerFormat: '<b>{series.name}</b><br>',
          pointFormat: '{point.x}, {point.y}'
        }
      }
    }
  };

  readonly className = ChartOptionClassName.ScatterSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: ScatterChartOption): ScatterChartOption {
    return new ScatterChartOption(obj.options);
  }

  static getDefaultChartOption(): ScatterChartOption {
    const textColor: string = this.getPrimaryTextColor();
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
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      xAxis: [
        {
          visible: true,
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
          gridLineWidth: '0.5',
          gridLineDashStyle: 'Solid',
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
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
      },
      plotOptions: {
        series: {
          marker: {
            enabled: true
          },
          dataLabels: {
            enabled: false,
            style: ChartOption.getSecondaryStyle()
          }
        }
      },
      numDataPoint: 1000
    };
    return new ScatterChartOption(options);
  }

  getNumDataPoint(): number | undefined {
    const numDataPoint: number = toNumber(this.options.numDataPoint);
    return isNaN(numDataPoint) ? void 0 : numDataPoint;
  }
}
