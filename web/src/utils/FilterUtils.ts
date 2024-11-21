import {
  ChartInfo,
  Condition,
  ConditionType,
  CrossFilterable,
  DynamicValueCondition,
  ValueController,
  Equal,
  FieldRelatedCondition,
  FilterableSetting,
  FunctionController,
  NestedCondition,
  TableColumn,
  ChartOptionClassName
} from '@core/common/domain/model';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { ListUtils } from '@/utils/ListUtils';
import { Log } from '@core/utils';

export abstract class FilterUtils {
  static getFilterColumn(querySetting: QuerySetting): TableColumn | undefined {
    if (FilterableSetting.isFilterable(querySetting)) {
      return querySetting.getFilterColumn();
    }
    if (CrossFilterable.isCrossFilterable(querySetting)) {
      return querySetting.getFilterColumn();
    }
    return void 0;
  }

  static getDynamicConditions(conditions: Condition[], result: DynamicValueCondition[]): DynamicValueCondition[] {
    if (ListUtils.isEmpty(conditions)) {
      return result;
    }
    const head = conditions[0];
    const rest = conditions.slice(1);
    if (DynamicValueCondition.isDynamicCondition(head)) {
      result.push(head);
    } else if (NestedCondition.isNestedCondition(head)) {
      return this.getDynamicConditions(head.getConditions().concat(rest), result);
    }
    return this.getDynamicConditions(rest, result);
  }
}
