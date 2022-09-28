/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/domain/Model';

export class HistogramChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'x'
    },
    plotOptions: {
      series: {
        groupPadding: 0,
        pointPadding: 0,
        borderWidth: 2
      }
    }
  };
  readonly chartFamilyType = ChartFamilyType.Histogram;
  readonly className = VizSettingType.HistogramSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: HistogramChartOption): HistogramChartOption {
    return new HistogramChartOption(obj.options);
  }

  static getDefaultChartOption(): HistogramChartOption {
    const textColor = this.getThemeTextColor();
    const options: SeriesOptionData = {
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
      background: this.getThemeBackgroundColor(),
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
      plotOptions: {
        series: {
          lineWidth: 2,
          groupPadding: 0,
          pointPadding: 0,
          borderWidth: 0.5,
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
      binsNumber: 5
    };

    return new HistogramChartOption(options);
  }
}
