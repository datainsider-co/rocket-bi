/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:46 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, LegendSetting, ChartOptionData, VizSettingType, SeriesOptionData } from '@core/domain/Model';

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
  readonly chartFamilyType = ChartFamilyType.Funnel;
  readonly className = VizSettingType.FunnelSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: FunnelChartOption): FunnelChartOption {
    return new FunnelChartOption(obj.options);
  }

  static getDefaultChartOption(): FunnelChartOption {
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
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
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

    return new FunnelChartOption(options);
  }
}
