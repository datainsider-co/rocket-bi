/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, SeriesOptionData, ChartOptionData, VizSettingType } from '@core/common/domain/model';

export class MapChartChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      resetZoomButton: {
        theme: {
          fill: '#3a3d4d',
          'stroke-width': 0.5,
          stroke: 'var(--primary)',
          r: 0,
          style: {
            color: '#ffffff'
          },
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
      }
    },
    colorAxis: {
      minColor: '#e8e8f5',
      maxColor: '#8a8ae2'
    },
    plotOptions: {
      map: {
        color: '#F2E8D6'
      }
    },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        align: 'left',
        verticalAlign: 'bottom',
        theme: {
          fill: '#3a3d4d',
          'stroke-width': 0.5,
          stroke: 'var(--primary)',
          r: 0,
          style: {
            color: '#ffffff'
          },
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
      }
    }
  };
  readonly chartFamilyType = ChartFamilyType.Map;
  readonly className = VizSettingType.MapSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: MapChartChartOption): MapChartChartOption {
    return new MapChartChartOption(obj.options);
  }

  static getDefaultChartOption(): MapChartChartOption {
    const textColor = this.getThemeTextColor();
    const options: SeriesOptionData = {
      chart: {
        // resetZoomButton: {
        //   theme: {
        //     fill: '#3a3d4d',
        //     'stroke-width': 0.5,
        //     stroke: 'var(--primary)',
        //     r: 0,
        //     style: {
        //       color: '#ffffff'
        //     },
        //     states: {
        //       hover: {
        //         fill: 'var(--primary)'
        //       },
        //       select: {
        //         stroke: 'var(--primary)',
        //         fill: 'var(--primary)'
        //       }
        //     }
        //   }
        // }
      },
      colorAxis: {
        minColor: '#F2E8D6',
        maxColor: '#FFAC05',
        noneColor: '#F2E8D6',
        labels: {
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
        map: {
          color: '#F2E8D6',
          borderWidth: 0.5,
          dataLabels: {
            enabled: false,
            style: {
              color: textColor,
              fontSize: '11px',
              fontFamily: 'Roboto',
              textOutline: 0
            }
          }
        }
      },
      geoArea: 'world.json',
      mapNavigation: {
        enabled: true
      },
      isCrossFilter: true,
      background: this.getThemeBackgroundColor()
    };
    return new MapChartChartOption(options);
  }
}
