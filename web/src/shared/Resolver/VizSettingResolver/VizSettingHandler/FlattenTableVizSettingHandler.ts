/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 12:04 PM
 */

import { ChartType } from '@/shared';
import { ChartOption, ChartOptionData, FlattenTableChartOption } from '@core/domain';
import { VizSettingHandler } from '@/shared/Resolver';

export class FlattenTableVizSettingHandler implements VizSettingHandler {
  toVizSetting(chartType: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    return new FlattenTableChartOption(diSettingOptions);
  }
}
