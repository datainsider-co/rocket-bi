/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, SeriesOptionData, VizSettingType } from '@core/domain/Model';

export class TreeMapChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    plotOptions: {
      treemap: {
        traverseUpButton: {
          position: {
            align: 'right'
          },
          theme: {
            fill: 'var(--transparent)',
            'stroke-width': 0.5,
            stroke: 'var(--primary)',
            r: 0,
            states: {
              hover: {
                fill: 'var(--primary)'
              },
              select: {
                stroke: 'var(--primary)',
                fill: 'var(--primary)'
              }
            }
          }
        },
        dataLabels: {
          enabled: false
        },
        levelIsConstant: false,
        levels: [
          {
            level: 1,
            dataLabels: {
              enabled: true
            },
            borderWidth: 3
          }
        ]
      }
    }
  };
  chartFamilyType = ChartFamilyType.TreeMap;
  className = VizSettingType.TreeMapSetting;

  constructor(options: {} = {}) {
    super(options);
  }

  public get paletteColors() {
    return this.options.paletteColors ?? ChartOption.DEFAULT_PALETTE_COLOR;
  }

  static fromObject(obj: TreeMapChartOption): TreeMapChartOption {
    return new TreeMapChartOption(obj.options);
  }

  static getDefaultChartOption(): TreeMapChartOption {
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
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
      plotOptions: {
        treemap: {
          dataLabels: {
            enabled: true
          },
          levels: [
            {
              level: 1
            }
          ]
        }
      }
    };
    return new TreeMapChartOption(options);
  }
}
