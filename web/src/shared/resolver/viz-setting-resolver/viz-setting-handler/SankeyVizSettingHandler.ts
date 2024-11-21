import { VizSettingHandler } from '@/shared/resolver';
import { ChartType } from '@/shared';
import { ChartOption, ChartOptionData, SankeyChartOption } from '@core/common/domain';

export class SankeyVizSettingHandler implements VizSettingHandler {
  toVizSetting(type: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    return new SankeyChartOption(diSettingOptions);
  }
}
