/*
 * @author: tvc12 - Thien Vi
 * @created: 7/20/21, 10:41 PM
 */

import { DrillThroughHandler } from '@/screens/DashboardDetail/components/DrillThrough/DrillThroguhHandler/DrillThroughHandler';
import { ChartInfo, DynamicFilter, FilterMode, HistogramQuerySetting } from '@core/domain';
import { ListUtils, SchemaUtils } from '@/utils';
import { InputType, NumberConditionTypes } from '@/shared';

export class HistogramDrillThroughHandler extends DrillThroughHandler {
  constructor() {
    super();
  }

  createFilter(metaData: ChartInfo, value: string): DynamicFilter[] {
    const { setting } = metaData;
    if (HistogramQuerySetting.isHistogramQuerySetting(setting)) {
      const column = setting.value;
      const field = column.function.field;
      const [minValue, maxValue] = JSON.parse(value);
      const minFilter = DynamicFilter.from(field, column.name, SchemaUtils.isNested(field.fieldName));
      minFilter.sqlView = ListUtils.getHead(setting.sqlViews);
      this.configFilter(minFilter, minValue, NumberConditionTypes.greaterThanOrEqual);

      const maxFilter = DynamicFilter.from(field, column.name, SchemaUtils.isNested(field.fieldName));
      maxFilter.sqlView = ListUtils.getHead(setting.sqlViews);
      this.configFilter(maxFilter, maxValue, NumberConditionTypes.lessThanOrEqual);

      return [minFilter, maxFilter];
    } else {
      return [];
    }
  }

  private configFilter(filter: DynamicFilter, value: number, optionType: string) {
    filter.filterModeSelected = FilterMode.range;
    filter.currentInputType = InputType.text;
    filter.currentOptionSelected = optionType;
    filter.currentValues = [value?.toString()];
  }
}
