/*
 * @author: tvc12 - Thien Vi
 * @created: 7/20/21, 10:37 PM
 */

import { ChartInfo, InternalFilter, FilterMode } from '@core/common/domain';
import { ChartUtils } from '@/utils';
import { InputType, StringConditionTypes } from '@/shared';

export abstract class DrillThroughHandler {
  abstract createFilter(metaData: ChartInfo, value: string): InternalFilter[];

  protected configFilterValue(filter: InternalFilter, value: string) {
    filter.currentValues = [value?.toString() || ''];
    if (ChartUtils.isNumberType(filter.field.fieldType)) {
      filter.filterModeSelected = FilterMode.Range;
      filter.currentInputType = InputType.Text;
      filter.currentOptionSelected = StringConditionTypes.equal;
    } else if (ChartUtils.isDateType(filter.field.fieldType)) {
      //FIXME: not working
    } else {
      filter.filterModeSelected = FilterMode.Selection;
      filter.currentInputType = InputType.MultiSelect;
      filter.currentOptionSelected = StringConditionTypes.in;
    }
  }
}
