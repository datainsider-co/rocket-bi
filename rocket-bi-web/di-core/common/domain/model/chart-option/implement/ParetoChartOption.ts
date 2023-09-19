/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, SeriesOptionData } from '@core/common/domain/model';
import { MapUtils } from '@/utils';

export class ParetoChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    yAxis: [
      {
        gridLineWidth: 0.5,
        gridLineColor: 'var(--grid-line-color)',
        tickLength: 0
        // gridLineDashStyle: 'longdash'
      },
      {
        gridLineWidth: 0.5,
        tickLength: 0,
        gridLineColor: 'var(--grid-line-color)'
        // gridLineDashStyle: 'longdash'
      }
    ],
    // xAxis: [
    //   {
    //     gridLineWidth: 0
    //     // gridLineColor: '#ffffffbb',
    //     // gridLineDashStyle: 'longdash'
    //   }
    // ],
    plotOptions: {
      series: {
        borderWidth: 0,
        borderColor: 'black'
      }
    }
  };

  className = ChartOptionClassName.ParetoSetting;
  baseTypes: Record<string, number>;

  constructor(options: ChartOptionData = {}, baseTypes: {} = {}) {
    super(options);
    this.baseTypes = MapUtils.isNotEmpty(baseTypes) ? baseTypes : this.toBaseTypes(options);
    // if (options.yAxis && options.yAxis[0]) {
    //   const yAxis: any[] = options.yAxis as any[];
    //   const dualAxis: any = cloneDeep(yAxis[0]);
    //   dualAxis.opposite = true;
    //   options.yAxis[1] = dualAxis;
    // }
  }

  static fromObject(obj: ParetoChartOption): ParetoChartOption {
    return new ParetoChartOption(obj.options, obj.baseTypes);
  }

  private toBaseTypes(options: Record<string, any>): Record<string, number> {
    if (options.baseTypes != undefined) {
      return {
        pareto: +options.baseTypes
      };
    }
    return {};
  }

  static getDefaultChartOption(): ParetoChartOption {
    const textColor: string = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'column'
      },
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
            enabled: true
          }
        }
      ],
      yAxis: [
        {
          visible: true,
          gridLineWidth: '0.5',
          labels: {
            style: {
              color: textColor
            }
          },
          title: {
            style: {
              color: textColor
            },
            enabled: true
          }
        },
        {
          gridLineColor: gridLineColor,
          gridLineWidth: '0.5',
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
            text: 'Pareto',
            enabled: true
          }
        }
      ],
      affectedByFilter: true,
      background: this.getThemeBackgroundColor(),
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
            style: {
              ...ChartOption.getSecondaryStyle(),
              textOutline: 0
            }
          }
        }
      }
    };
    return new ParetoChartOption(options);
  }
}
