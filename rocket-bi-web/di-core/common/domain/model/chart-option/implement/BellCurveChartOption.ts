/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, SeriesOptionData } from '@core/common/domain/model';
import { MapUtils, MetricNumberMode } from '@/utils';
import { toNumber } from 'lodash';

export class BellCurveChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'x'
    },
    plotOptions: {
      series: {
        label: {
          enabled: false
        }
      }
    },
    yAxis: [
      {
        gridLineWidth: 0.5,
        gridLineColor: 'var(--grid-line-color)',
        tickLength: 0
        // gridLineDashStyle: 'longdash'
      },
      {
        gridLineWidth: 0.5,
        gridLineColor: 'var(--grid-line-color)',
        tickLength: 0
        // gridLineDashStyle: 'longdash'
      }
    ],
    xAxis: [
      {
        gridLineWidth: 0
        // gridLineColor: '#ffffffbb',
        // gridLineDashStyle: 'longdash'
      }
    ]
  };

  className = ChartOptionClassName.BellCurveSetting;
  baseTypes: Record<string, number>;

  constructor(options: ChartOptionData = {}, baseTypes: {} = {}) {
    super(options);
    this.baseTypes = MapUtils.isNotEmpty(baseTypes) ? baseTypes : this.toBaseTypes(options);
    // const yAxis: any[] = options.yAxis as any[];
    // const dualAxis: any = cloneDeep(yAxis[0]);
    // dualAxis.opposite = true;
    // deleteProperty(dualAxis, 'title');
    // options.yAxis[1] = dualAxis;
  }

  static fromObject(obj: BellCurveChartOption): BellCurveChartOption {
    return new BellCurveChartOption(obj.options, obj.baseTypes);
  }

  private toBaseTypes(options: Record<string, any>): Record<string, number> {
    if (options.baseTypes != undefined) {
      return {
        bellCurve: +options.baseTypes
      };
    }
    return {};
  }
}

export class BellCurveChartOption2 extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'x'
    },
    plotOptions: {
      series: {
        label: {
          enabled: false
        }
      }
    }
    // yAxis: [
    //   {
    //     gridLineWidth: 0.5,
    //     gridLineColor: 'var(--grid-line-color)',
    //     tickLength: 0
    //     // gridLineDashStyle: 'longdash'
    //   },
    //   {
    //     gridLineWidth: 0.5,
    //     gridLineColor: 'var(--grid-line-color)',
    //     tickLength: 0
    //     // gridLineDashStyle: 'longdash'
    //   }
    // ],
    // xAxis: [
    //   {
    //     gridLineWidth: 0
    //     // gridLineColor: '#ffffffbb',
    //     // gridLineDashStyle: 'longdash'
    //   }
    // ]
  };

  className = ChartOptionClassName.BellCurve2Setting;
  baseTypes: Record<string, number>;

  constructor(options: ChartOptionData = {}, baseTypes: {} = {}) {
    super(options);
    this.baseTypes = MapUtils.isNotEmpty(baseTypes) ? baseTypes : this.toBaseTypes(options);
    // const yAxis: any[] = options.yAxis as any[];
    // const dualAxis: any = cloneDeep(yAxis[0]);
    // dualAxis.opposite = true;
    // deleteProperty(dualAxis, 'title');
    // options.yAxis[1] = dualAxis;
  }

  static fromObject(obj: BellCurveChartOption2): BellCurveChartOption2 {
    return new BellCurveChartOption2(obj.options, obj.baseTypes);
  }

  static getDefaultChartOption(): BellCurveChartOption2 {
    const textColor = this.getPrimaryTextColor();
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
      background: this.getThemeBackgroundColor(),
      xAxis: [
        {
          visible: true,
          title: {
            text: '',
            enabled: true,
            style: {
              color: textColor
            }
          },
          labels: {
            style: {
              color: textColor
            }
          }
        },
        {
          visible: true,
          title: {
            text: 'Bell curve',
            enabled: true,
            style: {
              color: textColor
            }
          },
          labels: {
            style: {
              color: textColor
            }
          }
        }
      ],
      yAxis: [
        {
          visible: true,
          title: {
            text: '',
            enabled: true,
            style: {
              color: textColor
            }
          },
          labels: {
            style: {
              color: textColor
            }
          },
          gridLineWidth: 0.5
        },
        {
          visible: true,
          title: {
            text: 'Bell curve',
            enabled: true,
            style: {
              color: textColor
            }
          },
          labels: {
            style: {
              color: textColor
            }
          },
          gridLineWidth: 0.5
        }
      ],
      plotOptions: {
        series: {
          lineWidth: 2,
          dashStyle: 'Solid',
          marker: {
            enabled: false
          },
          dataLabels: {
            enabled: false,
            displayUnit: MetricNumberMode.None,
            style: {
              ...ChartOption.getSecondaryStyle(),
              textOutline: 0
            }
          }
        }
      },
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
      }
    };
    return new BellCurveChartOption2(options);
  }

  getNumDataPoint(): number | undefined {
    const numDataPoint: number = toNumber(this.options.numDataPoint);
    return isNaN(numDataPoint) ? void 0 : numDataPoint;
  }

  private toBaseTypes(options: Record<string, any>): Record<string, number> {
    if (options.baseTypes != undefined) {
      return {
        bellCurve: +options.baseTypes
      };
    }
    return {};
  }
}
