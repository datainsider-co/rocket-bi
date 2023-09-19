import { ChartOption } from '../ChartOption';
import { ChartOptionData, SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';

export class SankeyChartOption extends ChartOption<SeriesOptionData> {
  readonly className: ChartOptionClassName = ChartOptionClassName.SankeySetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): SankeyChartOption {
    return new SankeyChartOption(obj.options);
  }

  static getDefaultChartOption(): SankeyChartOption {
    const textColor = this.getPrimaryTextColor();

    return new SankeyChartOption({
      chart: {
        type: 'sankey'
      },
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
      },
      plotOptions: {
        series: {
          dataLabels: [
            {
              enabled: true,
              style: {
                ...ChartOption.getSecondaryStyle(),
                textOutline: 0
              }
            }
          ]
        }
      },
      xAxis: [
        {
          visible: false
        }
      ],
      yAxis: [
        {
          visible: false
        }
      ],
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor()
    });
  }
}
