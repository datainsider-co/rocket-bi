/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/common/domain/model';

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
  readonly chartFamilyType = ChartFamilyType.Pyramid;
  readonly className = VizSettingType.PyramidSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: PyramidChartOption): PyramidChartOption {
    return new PyramidChartOption(obj.options);
  }

  static getDefaultChartOption(): PyramidChartOption {
    const textColor = this.getThemeTextColor();
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
      // tooltip: {
      //   fontFamily: 'Roboto',
      //   backgroundColor: '#333645',
      //   valueColor: '#FFFFFF'
      // },
      // value: {
      //   color: '#ffffffcc',
      //   backgroundColor: '#0000001A',
      //   align: 'left',
      //   alternateBackgroundColor: '#00000033',
      //   alternateColor: '#ffffffcc',
      //   enableUrlIcon: false,
      //   style: {
      //     color: '#ffffffcc',
      //     fontFamily: 'Roboto',
      //     fontSize: '12px',
      //     isWordWrap: false
      //   }
      // },
      // header: {
      //   align: 'left',
      //   backgroundColor: '#0000004D',
      //   color: '#FFFFFFCC',
      //   isWordWrap: false,
      //   isAutoWidthSize: false,
      //   style: {
      //     color: '#FFFFFFCC',
      //     isWordWrap: false,
      //     fontFamily: 'Roboto',
      //     fontSize: '12px'
      //   }
      // },
      // total: {
      //   enabled: true,
      //   backgroundColor: '#00000033',
      //   label: {
      //     text: 'Total',
      //     enabled: true,
      //     align: 'left',
      //     isWordWrap: false,
      //     backgroundColor: '#2f3240',
      //     style: {
      //       fontFamily: 'Roboto',
      //       fontSize: '12px',
      //       color: '#FFFFFFCC',
      //       isWordWrap: false
      //     }
      //   }
      // },
      background: this.getThemeBackgroundColor()
    };
    return new PyramidChartOption(options);
  }
}
