import { ChartType } from '@/shared';
import { ChartFamilyType, SeriesOptionData, VizSettingType } from '@core/common/domain/model';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';

export class VariablepieChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {};

  chartFamilyType = ChartFamilyType.Pie;
  className = VizSettingType.VariablepieSetting;

  constructor(options: SeriesOptionData) {
    super(options);
  }

  static fromObject(obj: VariablepieChartOption): VariablepieChartOption {
    return new VariablepieChartOption(obj.options);
  }

  static getDefaultChartOption(): VariablepieChartOption {
    const textColor = this.getThemeTextColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'variablepie'
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
          borderWidth: 0,
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
      },
      xAxis: [
        // {
        //   visible: true,
        //   labels: {
        //     style: {
        //       color: textColor
        //     }
        //   },
        //   title: {
        //     enabled: true,
        //     style: {
        //       color: textColor
        //     },
        //     text: ''
        //   },
        //   gridLineWidth: '0',
        //   gridLineColor: gridLineColor
        // }
      ],
      yAxis: [
        // {
        //   visible: true,
        //   opposite: true,
        //   labels: {
        //     style: {
        //       color: textColor
        //     }
        //   },
        //   title: {
        //     enabled: true,
        //     style: {
        //       color: textColor
        //     },
        //     text: ''
        //   },
        //   gridLineWidth: '0.5',
        //   gridLineColor: gridLineColor
        // },
        // {
        //   visible: false,
        //   labels: {
        //     style: {
        //       color: textColor
        //     }
        //   },
        //   title: {
        //     enabled: true,
        //     style: {
        //       color: textColor
        //     },
        //     text: 'Dual axis title'
        //   },
        //   gridLineWidth: '0.5',
        //   gridLineColor: gridLineColor
        // }
      ],
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      }
    };
    return new VariablepieChartOption(options);
  }
}
