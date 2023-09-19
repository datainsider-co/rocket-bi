/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, SeriesOptionData, ChartOptionClassName } from '@core/common/domain/model';

export class WordCloudChartOption extends ChartOption<SeriesOptionData> {
  static readonly DEFAULT_SETTING = {
    chart: {
      zoomType: 'x'
    }
  };

  readonly className = ChartOptionClassName.WordCloudSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: WordCloudChartOption): WordCloudChartOption {
    return new WordCloudChartOption(obj.options);
  }

  static getDefaultChartOption(): WordCloudChartOption {
    const textColor: string = this.getPrimaryTextColor();
    const options: SeriesOptionData = {
      chart: {
        type: 'wordcloud'
      },
      title: ChartOption.getDefaultTitle(),
      subtitle: ChartOption.getDefaultSubtitle(),
      affectedByFilter: true,
      themeColor: { enabled: true },
      background: this.getThemeBackgroundColor(),
      tooltip: {
        backgroundColor: this.getTooltipBackgroundColor(),
        style: ChartOption.getSecondaryStyle()
      }
    };
    return new WordCloudChartOption(options);
  }
}
