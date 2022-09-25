/*
 * @author: tvc12 - Thien Vi
 * @created: 7/20/21, 10:37 PM
 */

import { ChartInfo, DynamicFilter, FilterMode } from '@core/domain';
import { ChartUtils } from '@/utils';
import { InputType, StringConditionTypes } from '@/shared';

export abstract class DrillThroughHandler {
  abstract createFilter(metaData: ChartInfo, value: string): DynamicFilter[];

  protected configFilterValue(filter: DynamicFilter, value: string) {
    filter.currentValues = [value?.toString() || ''];
    if (ChartUtils.isNumberType(filter.field.fieldType)) {
      filter.filterModeSelected = FilterMode.range;
      filter.currentInputType = InputType.text;
      filter.currentOptionSelected = StringConditionTypes.equal;
    } else if (ChartUtils.isDateType(filter.field.fieldType)) {
      //FIXME: not working
    } else {
      filter.filterModeSelected = FilterMode.selection;
      filter.currentInputType = InputType.multiSelect;
      filter.currentOptionSelected = StringConditionTypes.in;
    }
  }
}
