/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';

export class FunnelChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    plotOptions: {
      funnel: {
        borderWidth: 0,
        borderColor: 'black',
        showInLegend: true,
        dataLabels: {
          enabled: false
        }
      }
    }
  };

  readonly className = ChartOptionClassName.FunnelSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: FunnelChartOption): FunnelChartOption {
    return new FunnelChartOption(obj.options);
  }

  static getDefaultChartOption(): FunnelChartOption {
    const textColor = this.getPrimaryTextColor();
    const options: SeriesOptionData = {
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
      plotOptions: {
        funnel: {
          dataLabels: {
            enabled: true,
            style: {
              color: textColor
            }
          }
        }
      },
      affectedByFilter: true,
      center: ['40%', '50%'],
      height: '90%',
      neckWidth: '20%',
      neckHeight: '25%',
      width: '60%',
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
      },
      background: this.getThemeBackgroundColor()
    };

    return new FunnelChartOption(options);
  }
}
