/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/common/domain/model';

export class DonutChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    plotOptions: {
      pie: {
        borderWidth: 0,
        borderColor: 'black',
        dataLabels: {
          borderWidth: 0,
          textOutline: '0px contrast',
          useHTML: true,
          style: {
            border: '0px transparent',
            borderColor: 'none',
            textShadow: false,
            outline: 'none'
          }
        }
      }
    }
  };
  readonly chartFamilyType = ChartFamilyType.Pie;
  readonly className = VizSettingType.DonutSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: DonutChartOption): DonutChartOption {
    return new DonutChartOption(obj.options);
  }

  static getDefaultChartOption(): DonutChartOption {
    const textColor = this.getThemeTextColor();
    const options: SeriesOptionData = {
      legend: {
        enabled: true,
        verticalAlign: 'bottom',
        layout: 'horizontal',
        align: 'center',
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
        verticalAlign: 'middle',
        text: 'Untitled chart',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '20px'
        }
      },
      themeColor: { enabled: true },
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
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
      plotOptions: {
        pie: {
          innerSize: '50%',
          dataLabels: {
            enabled: false,
            style: {
              color: textColor
            }
          }
        }
      },
      affectedByFilter: true,
      isCrossFilter: true,
      background: this.getThemeBackgroundColor()
    };
    return new DonutChartOption(options);
  }
}
