/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, SeriesOptionData, ChartOptionData, VizSettingType } from '@core/domain/Model';
import { MapUtils } from '@/utils';
import { cloneDeep } from 'lodash';
const deleteProperty = Reflect.deleteProperty;

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
  chartFamilyType = ChartFamilyType.Pareto;
  className = VizSettingType.ParetoSetting;
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
    const textColor: string = this.getThemeTextColor();
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
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
      plotOptions: {
        series: {
          marker: {
            enabled: true
          },
          dataLabels: {
            enabled: false,
            style: {
              color: textColor,
              fontSize: '11px',
              fontFamily: 'Roboto',
              textOutline: 0
            }
          }
        }
      }
    };
    return new ParetoChartOption(options);
  }
}
