/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/domain/Model';
import { MapUtils, MetricNumberMode } from '@/utils';
import { cloneDeep, toNumber } from 'lodash';

const deleteProperty = Reflect.deleteProperty;

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
  chartFamilyType = ChartFamilyType.BellCurve;
  className = VizSettingType.BellCurveSetting;
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
  chartFamilyType = ChartFamilyType.BellCurve;
  className = VizSettingType.BellCurve2Setting;
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
    const textColor = this.getThemeTextColor();
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
              color: textColor,
              fontSize: '11px',
              fontFamily: 'Roboto',
              textOutline: 0
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
