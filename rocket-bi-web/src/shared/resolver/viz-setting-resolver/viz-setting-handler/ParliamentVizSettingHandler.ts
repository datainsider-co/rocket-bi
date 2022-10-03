/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 12:00 PM
 */

import { ChartType } from '@/shared';
import { ParliamentChartOption, ChartOption, ChartOptionData } from '@core/common/domain';
import { VizSettingHandler } from '@/shared/resolver';

export class ParliamentVizSettingHandler implements VizSettingHandler {
  toVizSetting(chartType: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    return new ParliamentChartOption(diSettingOptions);
  }
}
