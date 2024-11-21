/*
 * @author: tvc12 - Thien Vi
 * @created: 7/20/21, 10:41 PM
 */

import { DrillThroughHandler } from '@/screens/dashboard-detail/components/drill-through/drill-throguh-handler/DrillThroughHandler';
import { ChartInfo, InternalFilter, FilterMode, HistogramQuerySetting } from '@core/common/domain';
import { ListUtils, SchemaUtils } from '@/utils';
import { DateHistogramConditionTypes, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';

export class HistogramDrillThroughHandler extends DrillThroughHandler {
  constructor() {
    super();
  }

  createFilter(metaData: ChartInfo, value: string): InternalFilter[] {
    const { setting } = metaData;
    if (HistogramQuerySetting.isHistogramQuerySetting(setting)) {
      const column = setting.value;
      const field = column.function.field;
      const [minValue, maxValue] = JSON.parse(value);
      const minFilter = InternalFilter.from(field, column.name, SchemaUtils.isNested(field.fieldName));
      minFilter.sqlView = ListUtils.getHead(setting.sqlViews);
      this.configFilter(minFilter, minValue, NumberConditionTypes.greaterThanOrEqual);

      const maxFilter = InternalFilter.from(field, column.name, SchemaUtils.isNested(field.fieldName));
      maxFilter.sqlView = ListUtils.getHead(setting.sqlViews);
      this.configFilter(maxFilter, maxValue, NumberConditionTypes.lessThanOrEqual);

      return [minFilter, maxFilter];
    } else {
      return [];
    }
  }

  private configFilter(filter: InternalFilter, value: number, optionType: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes) {
    filter.filterModeSelected = FilterMode.Range;
    filter.currentInputType = InputType.Text;
    filter.currentOptionSelected = optionType;
    filter.currentValues = [value?.toString()];
  }
}
