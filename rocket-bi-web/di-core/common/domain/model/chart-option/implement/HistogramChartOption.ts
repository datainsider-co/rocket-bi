/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';

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

  readonly className = ChartOptionClassName.HistogramSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: HistogramChartOption): HistogramChartOption {
    return new HistogramChartOption(obj.options);
  }

  static getDefaultChartOption(): HistogramChartOption {
    const textColor = this.getPrimaryTextColor();
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
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      background: this.getThemeBackgroundColor(),
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
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
            style: ChartOption.getSecondaryStyle()
          }
        }
      },
      binsNumber: 5
    };

    return new HistogramChartOption(options);
  }
}
