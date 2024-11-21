/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, SeriesOptionData } from '@core/common/domain/model';
import { ChartType } from '@/shared';

export class GenericChartOption extends ChartOption<SeriesOptionData> {
  className = ChartOptionClassName.GenericSetting;
  constructor(options: SeriesOptionData) {
    super(options);
  }

  static fromObject(obj: GenericChartOption): GenericChartOption {
    return new GenericChartOption(obj.options);
  }
  static getDefaultColumnRangeOption(): GenericChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'columnrange',
        inverted: true
      },
      legend: {
        enabled: false,
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
    return new GenericChartOption(options);
  }
  static getDefaultAreaRangeOption(): GenericChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridLineColor: string = this.getGridLineColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'arearange',
        zooming: {
          type: 'x'
        }
      },
      legend: {
        enabled: false,
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
    return new GenericChartOption(options);
  }

  static getDefaultChartOption(chartType: ChartType): GenericChartOption {
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
    return new GenericChartOption(options);
  }

  private static getTextColor(): string {
    return '#FFFFFF';
  }
}
