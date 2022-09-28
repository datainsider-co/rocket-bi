/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:11 AM
 */

import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { ChartFamilyType, SeriesOptionData, VizSettingType } from '@core/domain/Model';

export enum ParliamentDisplayType {
  Parliament = 'parliament',
  Rectangle = 'rectangle',
  Circle = 'circle'
}

export interface ParliamentOptionData extends SeriesOptionData {
  displayType?: ParliamentDisplayType;
  maxDataPoint?: number;
}

export class ParliamentChartOption extends ChartOption<ParliamentOptionData> {
  static readonly DEFAULT_SETTING = {
    plotOptions: {
      item: {
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
  private static readonly DEFAULT_MAX_DATA_POINT = 1500;
  readonly chartFamilyType = ChartFamilyType.Parliament;
  readonly className = VizSettingType.ParliamentSetting;

  constructor(options: ParliamentOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any & ParliamentChartOption): ParliamentChartOption {
    return new ParliamentChartOption(obj.options);
  }

  static getDefaultChartOption(): ParliamentChartOption {
    const textColor = this.getThemeTextColor();
    const options: ParliamentOptionData = {
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
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      },
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      plotOptions: {
        item: {
          borderWidth: 0,
          borderColor: 'black',
          dataLabels: {
            enabled: false,
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
      },
      maxDataPoint: 1000
    };

    return new ParliamentChartOption(options);
  }

  getDisplayType(): ParliamentDisplayType {
    return this.options.displayType ?? ParliamentDisplayType.Parliament;
  }

  getMaxDataPoint(): number {
    return this.options.maxDataPoint || ParliamentChartOption.DEFAULT_MAX_DATA_POINT;
  }
}
