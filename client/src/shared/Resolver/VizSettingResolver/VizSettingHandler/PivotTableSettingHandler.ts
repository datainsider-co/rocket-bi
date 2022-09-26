/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 12:05 PM
 */

import { ChartType } from '@/shared';
import { PivotTableChartOption, ChartOption, ChartOptionData } from '@core/domain';
import { VizSettingHandler } from '@/shared/Resolver';

export class PivotTableSettingHandler implements VizSettingHandler {
  toVizSetting(type: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    return new PivotTableChartOption(diSettingOptions);
  }
}
