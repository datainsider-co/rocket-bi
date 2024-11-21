/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { AxisSetting, ChartOptionData, LabelsSetting, LegendSetting, MapNavigation, ChartOptionClassName } from '@core/common/domain/model';
import { StringUtils } from '@/utils/StringUtils';
import { cloneDeep, merge } from 'lodash';
import { ObjectUtils } from '@core/utils/ObjectUtils';
import { PlotOptions } from '@core/common/domain/model/chart-option/extra-setting/chart-style/PlotOptions';
import { ChartTooltipSetting } from '@core/common/domain/model/chart-option/extra-setting/chart-style/ChartTooltipSetting';
import { ChartType } from '@/shared';

const deleteProperty = Reflect.deleteProperty;

export interface ColorAxis {
  maxColor?: string;
  minColor?: string;
  noneColor?: string;
  labels?: LabelsSetting;
}

export interface ThemeColor {
  enabled?: boolean;
  colors?: string[];
}

export interface SeriesOptionData extends ChartOptionData {
  legend?: LegendSetting;
  xAxis?: AxisSetting[];
  yAxis?: AxisSetting[];
  colors?: string[];
  colorAxis?: ColorAxis;
  plotOptions?: PlotOptions;
  tooltip?: ChartTooltipSetting;
  mapNavigation?: MapNavigation;
}

export class SeriesChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'x'
    },
    tooltip: {
      shared: true,
      headerFormat: '<span style="font-size: 15px">{point.point.name}</span><br/>',
      pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>'
    },
    yAxis: [
      {
        // gridLineWidth: 0.5,
        // gridLineColor: 'var(--grid-line-color)',
        tickLength: 0,
        opposite: false,
        tickAmount: undefined
        // gridLineColor: '#ffffffbb',
        // gridLineDashStyle: 'longdash'
      },
      {
        tickLength: 0,
        opposite: true,
        tickAmount: undefined,
        title: {
          text: ''
        }
      }
    ],
    xAxis: {
      lineWidth: 0.5,
      lineColor: 'var(--grid-line-color)'
      // gridLineDashStyle: 'longdash'
    },
    plotOptions: {
      series: {
        borderWidth: 0,
        borderColor: 'black',
        // threshold: null,
        dataLabels: {
          borderWidth: 0,
          textOutline: '0px contrast',
          useHTML: true,
          style: {
            border: '0px',
            borderColor: 'none',
            textShadow: false
          }
        },
        label: {
          enabled: false
        }
      }
    }
  };

  className = ChartOptionClassName.SeriesSetting;

  /**
   * @key: label (Online, Offline)
   * @value: group (stack_group_0, stack_group_1)
   */
  stackingGroup: Map<string, string>;
  /**
   * @seriesTypeByLabelMap will replace @seriesTypes
   * @key: label (Online, Offline)
   * @value: chartType (line, column)
   */
  seriesTypesByLabelMap: Map<string, string>;

  constructor(options: SeriesOptionData) {
    super(options);
    options = this.toSeriesOptions(options);
    this.stackingGroup = this.toStackingGroup(options || {});
    this.seriesTypesByLabelMap = this.toSeriesTypeByLabelMap(options || {});
  }

  static fromObject(obj: SeriesChartOption): SeriesChartOption {
    return new SeriesChartOption(obj.options);
  }

  static getDefaultAreaInvertedOption(): SeriesChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'area',
        inverted: true
      },

      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        floating: true,
        enabled: true,
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
          labels: {
            style: {
              color: textColor
            }
          },
          title: {
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0',
          gridLineColor: gridLineColor
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
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        },
        {
          visible: false,
          labels: {
            style: {
              color: textColor
            }
          },
          title: {
            enabled: true,
            style: {
              color: textColor
            },
            text: 'Dual axis title'
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        }
      ],
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: ChartOption.getSecondaryFontFamily()
        }
      }
    };
    return new SeriesChartOption(options);
  }

  static getDefaultLineInvertedOption(): SeriesChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'line',
        inverted: true
      },

      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        floating: true,
        enabled: true,
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
          labels: {
            style: {
              color: textColor
            }
          },
          title: {
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0',
          gridLineColor: gridLineColor
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
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        },
        {
          visible: false,
          labels: {
            style: {
              color: textColor
            }
          },
          title: {
            enabled: true,
            style: {
              color: textColor
            },
            text: 'Dual axis title'
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        }
      ],
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: ChartOption.getSecondaryFontFamily()
        }
      }
    };
    return new SeriesChartOption(options);
  }

  static getDefaultColumnRangeOption(): SeriesChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'columnrange',
        inverted: true
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
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      plotOptions: {
        area: {
          stacking: 'value'
        },
        series: {
          lineWidth: 2,
          dashStyle: 'Solid',
          dataLabels: {
            enabled: false,
            style: {
              ...ChartOption.getSecondaryStyle(),
              color: textColor,
              textOutline: 0
            }
          }
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
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0',
          gridLineColor: gridLineColor
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
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        },
        {
          visible: false,
          labels: {
            style: {
              color: textColor
            }
          },
          title: {
            enabled: true,
            style: {
              color: textColor
            },
            text: 'Dual axis title'
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        }
      ],
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: ChartOption.getSecondaryFontFamily()
        }
      }
    };
    return new SeriesChartOption(options);
  }

  static getDefaultChartOption(chartType: ChartType): SeriesChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        type: chartType
      },
      legend: {
        enabled: false
      },
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      plotOptions: {
        series: {
          lineWidth: 2,
          dashStyle: 'Solid',
          marker: {
            enabled: false
          },
          dataLabels: {
            enabled: false,
            style: {
              ...ChartOption.getSecondaryStyle(),
              color: textColor,
              textOutline: 0
            }
          }
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
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0',
          gridLineColor: gridLineColor
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
            enabled: true,
            style: {
              color: textColor
            },
            text: ''
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        },
        {
          visible: false,
          labels: {
            style: {
              color: textColor
            }
          },
          title: {
            enabled: true,
            style: {
              color: textColor
            },
            text: 'Dual axis title'
          },
          gridLineWidth: '0.5',
          gridLineColor: gridLineColor
        }
      ],
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: ChartOption.getSecondaryFontFamily()
        }
      }
    };
    return new SeriesChartOption(options);
  }

  private toStackingGroup(options: Record<string, any>): Map<string, string> {
    const stackingGroup: Map<string, string> = new Map();
    if (options.stackingGroup) {
      for (const key in options.stackingGroup) {
        const group = options.stackingGroup[`${key}`];
        stackingGroup.set(StringUtils.toCamelCase(key), group);
      }
    }
    return stackingGroup;
  }

  private toSeriesOptions(options: SeriesOptionData): SeriesOptionData {
    const result = {
      ...options
    };
    const haveDualAxis: boolean = result.dualAxis != undefined && result.dualAxis != -1;
    // @ts-ignore
    const noneStacking = result.plotOptions?.series?.stacking == 'none';
    const haveStackPercentage: boolean = result.plotOptions?.series?.stacking == 'percent';
    if (haveDualAxis && (result.yAxis as any[]).length < 2) {
      const yAxis: any[] = result.yAxis as any[];
      const dualAxis: any = cloneDeep(yAxis[0]);
      dualAxis.opposite = true;
      dualAxis.id = 'dual-axis';
      deleteProperty(dualAxis, 'title');
      // @ts-ignore
      result.yAxis[1] = dualAxis;
    }
    if (noneStacking) {
      // @ts-ignore
      result.plotOptions.series.stacking = undefined;
    } else if (haveStackPercentage) {
      const plotOptions = ObjectUtils.toObject('plotOptions.series.threshold', 0);
      merge(result, plotOptions);
    }
    return result;
  }

  private toSeriesTypeByLabelMap(options: Record<string, any>): Map<string, string> {
    const seriesTypeByLabelMap: Map<string, string> = new Map();
    if (options.typesByLabel) {
      for (const key in options.typesByLabel) {
        let type = options.typesByLabel[`${key}`];
        type = ChartOption.CHART_TYPE_CONVERT.get(type) ?? type;
        seriesTypeByLabelMap.set(StringUtils.toCamelCase(key), type);
      }
    }
    return seriesTypeByLabelMap;
  }

  private static getTextColor(): string {
    return '#FFFFFF';
  }
}
