import { ChartType } from '@/shared';
import { SpiderWebChartOption, ChartOption, ChartOptionData } from '@core/common/domain';
import { VizSettingHandler } from '@/shared/resolver';
import { merge } from 'lodash';

export class SpiderWebVizSettingHandler implements VizSettingHandler {
  toVizSetting(type: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    let widgetType: string = type;
    if (ChartOption.CHART_TYPE_CONVERT.has(type)) {
      widgetType = ChartOption.CHART_TYPE_CONVERT.get(type) ?? type;
    }
    const newObject = merge(
      {
        chart: {
          type: widgetType
        }
      },
      diSettingOptions
    );
    return new SpiderWebChartOption(newObject);
  }
}
