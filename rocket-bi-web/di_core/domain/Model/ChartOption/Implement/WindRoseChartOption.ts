/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/domain/Model';
import { StringUtils } from '@/utils/string.utils';
import { cloneDeep, merge } from 'lodash';
import { ObjectUtils } from '@core/utils/ObjectUtils';

const deleteProperty = Reflect.deleteProperty;

export class WindRoseChartOption extends ChartOption {
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
        gridLineWidth: 0,
        // gridLineColor: 'var(--grid-line-color)',
        tickLength: 0,
        opposite: false,
        tickAmount: undefined,
        gridLineInterpolation: 'polygon',
        lineWidth: 0
        // gridLineColor: '#ffffffbb',
        // gridLineDashStyle: 'longdash'
      }
    ],
    xAxis: {
      lineColor: 'var(--grid-line-color)',
      tickmarkPlacement: 'on',
      lineWidth: 0
      // gridLineDashStyle: 'longdash'
    },
    plotOptions: {
      series: {
        pointPlacement: 'on',
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

  chartFamilyType = ChartFamilyType.Series;
  className = VizSettingType.WindRoseSetting;

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

  constructor(options: ChartOptionData) {
    super(options);
    options = this.toSeriesOptions(options);
    this.stackingGroup = this.toStackingGroup(options || {});
    this.seriesTypesByLabelMap = this.toSeriesTypeByLabelMap(options || {});
  }

  static fromObject(obj: WindRoseChartOption): WindRoseChartOption {
    return new WindRoseChartOption(obj.options);
  }

  static getDefaultChartOption(): WindRoseChartOption {
    const textColor = this.getThemeTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        polar: true,
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
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      plotOptions: {
        series: {
          stacking: 'normal',
          lineWidth: 2,
          dashStyle: 'Solid',
          marker: {
            enabled: true
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
        }
      ],
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      }
    };
    return new WindRoseChartOption(options);
  }

  private toStackingGroup(options: Record<string, any>): Map<string, string> {
    const stackingGroup: Map<string, string> = new Map();
    if (options.stackingGroup) {
      for (const key in options.stackingGroup) {
        const group = options.stackingGroup[`${key}`];
        stackingGroup.set(StringUtils.removeWhiteSpace(StringUtils.camelToCapitalizedStr(key).replace('.', '')), group);
      }
    }
    return stackingGroup;
  }

  private toSeriesOptions(options: ChartOptionData): ChartOptionData {
    const result = {
      ...options
    };
    const haveDualAxis: boolean = result.dualAxis != undefined && result.dualAxis != -1;
    const haveStackPercentage: boolean = result.plotOptions?.series?.stacking == 'percent';
    if (haveDualAxis && (result.yAxis as any[]).length < 2) {
      const yAxis: any[] = result.yAxis as any[];
      const dualAxis: any = cloneDeep(yAxis[0]);
      dualAxis.opposite = true;
      deleteProperty(dualAxis, 'title');
      result.yAxis[1] = dualAxis;
    }
    if (haveStackPercentage) {
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
        seriesTypeByLabelMap.set(StringUtils.removeWhiteSpace(StringUtils.camelToCapitalizedStr(key)).replace('.', ''), type);
      }
    }
    return seriesTypeByLabelMap;
  }
}
