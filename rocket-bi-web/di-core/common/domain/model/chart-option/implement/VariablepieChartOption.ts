import { SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';

export class VariablepieChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {};

  className = ChartOptionClassName.VariablePieSetting;

  constructor(options: SeriesOptionData) {
    super(options);
  }

  static fromObject(obj: VariablepieChartOption): VariablepieChartOption {
    return new VariablepieChartOption(obj.options);
  }

  static getDefaultChartOption(): VariablepieChartOption {
    const textColor = this.getPrimaryTextColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'variablepie'
      },
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),

      plotOptions: {
        series: {
          borderWidth: 0,
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
          fontFamily: ChartOption.getSecondaryFontFamily()
        }
      }
    };
    return new VariablepieChartOption(options);
  }
}
