/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, StackedOptionData, ChartOptionClassName } from '@core/common/domain/model';
import { StringUtils } from '@/utils/StringUtils';
import { cloneDeep, merge } from 'lodash';
import { ObjectUtils } from '@core/utils/ObjectUtils';

const deleteProperty = Reflect.deleteProperty;

export class CircularChartOption extends ChartOption<StackedOptionData> {
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
    xAxis: [
      {
        lineWidth: 0.5,
        lineColor: 'var(--grid-line-color)'
        // gridLineDashStyle: 'longdash'
      }
    ],
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

  readonly className = ChartOptionClassName.CircularBarSetting;
  /**
   * @key: label (Online, Offline)
   * @value: group (stack_group_0, stack_group_1)
   */
  stackingGroup: Map<string, string>;
  /**
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

  static fromObject(obj: CircularChartOption): CircularChartOption {
    return new CircularChartOption(obj.options);
  }

  static getDefaultChartOption(): CircularChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: StackedOptionData = {
      chart: {
        type: 'column',
        polar: true,
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
        series: {
          stacking: 'normal',
          pointPadding: 0,
          groupPadding: 0.15,
          dashStyle: 'Solid',
          marker: {
            enabled: true
          },
          dataLabels: {
            enabled: false,
            style: ChartOption.getSecondaryStyle()
          }
        }
      },
      pane: {
        size: '85%',
        innerSize: '20%',
        endAngle: 270
      },
      xAxis: [
        {
          visible: true,
          labels: {
            style: {
              color: textColor
            },
            y: 6
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
      yAxis: [
        {
          visible: true,
          endOnTick: true,
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
        style: ChartOption.getSecondaryStyle()
      }
    };
    return new CircularChartOption(options);
  }

  private toStackingGroup(options: Record<string, any>): Map<string, string> {
    const stackingGroup: Map<string, string> = new Map();
    if (options.stackingGroup) {
      for (const key in options.stackingGroup) {
        const stack = options.stackingGroup[`${key}`];
        stackingGroup.set(StringUtils.toCamelCase(key), stack);
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
      dualAxis.id = 'dual-axis';
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
        seriesTypeByLabelMap.set(StringUtils.toCamelCase(key), type);
      }
    }
    return seriesTypeByLabelMap;
  }
}
