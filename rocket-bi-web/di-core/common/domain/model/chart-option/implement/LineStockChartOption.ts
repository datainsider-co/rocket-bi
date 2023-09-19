import { ChartType } from '@/shared';
import { SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';

export class LineStockChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      // zoomType: 'x'
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
        opposite: false,
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

  className = ChartOptionClassName.LineStockSetting;

  constructor(options: SeriesOptionData) {
    super(options);
  }

  static fromObject(obj: LineStockChartOption): LineStockChartOption {
    return new LineStockChartOption(obj.options);
  }

  static getDefaultChartOption(chartType: ChartType): LineStockChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const enableMarker = chartType === ChartType.Lollipop;
    const options: SeriesOptionData = {
      chart: {
        type: this.getHighchartType(chartType)
      },
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      rangeSelector: {
        inputEnabled: false //Calendar
      },
      plotOptions: {
        series: {
          lineWidth: 2,
          compare: 'value',
          dashStyle: 'Solid',
          marker: {
            enabled: enableMarker
          },
          dataLabels: {
            enabled: false,
            style: {
              ...ChartOption.getSecondaryStyle(),
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
          opposite: true,
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
        style: ChartOption.getSecondaryStyle()
      }
    };
    return new LineStockChartOption(options);
  }
}
