/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 12:04 PM
 */

import { ChartType } from '@/shared';
import { TableChartOption, ChartOption, ChartOptionData } from '@core/common/domain';
import { VizSettingHandler } from '@/shared/resolver';

export class TableVizSettingHandler implements VizSettingHandler {
  toVizSetting(chartType: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    return new TableChartOption(diSettingOptions);
  }
}
