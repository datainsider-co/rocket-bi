import { VizSettingHandler } from '@/shared/Resolver';
import { ChartType } from '@/shared';
import { ChartOption, ChartOptionData, SankeyChartOption } from '@core/domain';

export class SankeyVizSettingHandler implements VizSettingHandler {
  toVizSetting(type: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    return new SankeyChartOption(diSettingOptions);
  }
}
