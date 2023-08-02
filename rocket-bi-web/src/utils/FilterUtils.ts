import {
  ChartInfo,
  Condition,
  ConditionType,
  CrossFilterable,
  DynamicValueCondition,
  DynamicValues,
  Equal,
  FieldRelatedCondition,
  Filterable,
  FunctionControl,
  NestedCondition,
  TableColumn,
  VizSettingType
} from '@core/common/domain/model';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { ListUtils } from '@/utils/ListUtils';
import { Log } from '@core/utils';

export abstract class FilterUtils {
  static getFilterColumn(querySetting: QuerySetting): TableColumn | undefined {
    if (Filterable.isFilterable(querySetting)) {
      return querySetting.getFilter();
    }
    if (CrossFilterable.isCrossFilterable(querySetting)) {
      return querySetting.getFilter();
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
