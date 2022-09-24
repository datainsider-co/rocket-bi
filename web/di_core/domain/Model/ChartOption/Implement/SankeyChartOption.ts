import { ChartOption } from '../ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/domain/Model';

export class SankeyChartOption extends ChartOption<SeriesOptionData> {
  readonly chartFamilyType: ChartFamilyType = ChartFamilyType.Sankey;
  readonly className: VizSettingType = VizSettingType.SankeySetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): SankeyChartOption {
    return new SankeyChartOption(obj.options);
  }

  static getDefaultChartOption(): SankeyChartOption {
    const textColor = this.getThemeTextColor();

    return new SankeyChartOption({
      chart: {
        type: 'sankey'
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
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
      plotOptions: {
        series: {
          dataLabels: [
            {
              enabled: true,
              style: {
                color: textColor,
                fontSize: '11px',
                fontFamily: 'Roboto',
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
