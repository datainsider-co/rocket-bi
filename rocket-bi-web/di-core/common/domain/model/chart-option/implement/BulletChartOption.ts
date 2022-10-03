import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/common/domain/model';

export class BulletChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {};
  chartFamilyType = ChartFamilyType.Gauge;
  className = VizSettingType.BulletSetting;

  constructor(options: ChartOptionData = {}) {
    super({ ...options });
  }

  static fromObject(obj: BulletChartOption): BulletChartOption {
    return new BulletChartOption(obj.options);
  }

  static getDefaultChartOption(): BulletChartOption {
    const min = 0;
    const mileStone1 = 5000;
    const mileStone2 = 7500;
    const max = 10000;
    const textColor: string = this.getThemeTextColor();
    const options: SeriesOptionData = {
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
      plotOptions: {
        series: {
          color: '#0267DE',
          pointPadding: 0.25,
          borderWidth: 0,
          targetOptions: {
            height: 3,
            color: '#0267DE'
          }
        }
      },
      yAxis: [
        {
          visible: true,
          plotBands: [
            {
              from: min,
              to: mileStone1,
              color: '#75ABEA'
            },
            {
              from: mileStone1,
              to: mileStone2,
              color: '#8ABCF8'
            },
            {
              from: mileStone2,
              to: max,
              color: '#A9CBF4'
            }
          ]
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
    return new BulletChartOption(options);
  }
}
