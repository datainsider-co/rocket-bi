/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';

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

  className = ChartOptionClassName.TreeMapSetting;

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
    const textColor: string = this.getPrimaryTextColor();
    const options: SeriesOptionData = {
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
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
