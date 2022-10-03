/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, SeriesOptionData, VizSettingType } from '@core/common/domain/model';

export class WordCloudChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'x'
    }
  };
  readonly chartFamilyType = ChartFamilyType.WordCloud;
  readonly className = VizSettingType.WordCloudSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: WordCloudChartOption): WordCloudChartOption {
    return new WordCloudChartOption(obj.options);
  }

  static getDefaultChartOption(): WordCloudChartOption {
    const textColor: string = this.getThemeTextColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'wordcloud'
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
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: {
          color: textColor,
          fontFamily: 'Roboto'
        }
      }
    };
    return new WordCloudChartOption(options);
  }
}
