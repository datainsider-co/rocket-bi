/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 12:04 PM
 */

import { ChartType } from '@/shared';
import { GaugeChartOption, ChartOption, ChartOptionData } from '@core/domain';
import { merge } from 'lodash';
import { VizSettingHandler } from '@/shared/Resolver';

export class GaugeVizSettingHandler implements VizSettingHandler {
  toVizSetting(chartType: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    let type: string = chartType;
    if (ChartOption.CHART_TYPE_CONVERT.has(type)) {
      type = ChartOption.CHART_TYPE_CONVERT.get(type) ?? type;
    }
    const newObject = merge(
      {
        chart: {
          type: type
        }
      },
      diSettingOptions
    );
    return new GaugeChartOption(newObject);
  }
}
