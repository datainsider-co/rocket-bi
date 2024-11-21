/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';

export class PyramidChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    plotOptions: {
      pyramid: {
        borderWidth: 0,
        borderColor: 'black',
        showInLegend: true,
        dataLabels: {
          enabled: false
        }
      }
    }
  };

  readonly className = ChartOptionClassName.PyramidSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: PyramidChartOption): PyramidChartOption {
    return new PyramidChartOption(obj.options);
  }

  static getDefaultChartOption(): PyramidChartOption {
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
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
      },
      plotOptions: {
        pyramid: {
          dataLabels: {
            enabled: true,
            style: {
              color: textColor
            }
          }
        }
      },
      affectedByFilter: true,
      themeColor: { enabled: true },
      center: ['40%', '50%'],
      width: '80%',
      background: this.getThemeBackgroundColor()
    };
    return new PyramidChartOption(options);
  }
}
