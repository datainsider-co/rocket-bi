import {
  ChartInfo,
  Condition,
  ConditionType,
  DynamicValueCondition,
  Equal,
  FieldRelatedCondition,
  Filterable,
  NestedCondition,
  TableColumn,
  VizSettingType
} from '@core/common/domain/model';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { ListUtils } from '@/utils/ListUtils';

export abstract class FilterUtils {
  static getFilterColumn(querySetting: QuerySetting): TableColumn | undefined {
    if (Filterable.isFilterable(querySetting)) {
      return querySetting.getFilter();
    } else {
      return void 0;
    }
  }

  static getFilterValue(condition: FieldRelatedCondition | undefined): string | undefined {
    switch (condition?.className) {
      case ConditionType.Equal:
        return (condition as Equal).value;
      default:
        return void 0;
    }
  }

  static isFilter(filter: ChartInfo): boolean {
    switch (filter.setting.getChartOption()?.className) {
      case VizSettingType.TabFilterSetting:
      case VizSettingType.InputFilterSetting:
      case VizSettingType.SlicerFilterSetting:
      case VizSettingType.DateSelectFilterSetting:
        return true;
      default:
        return false;
    }
    // return !!this.getFilterColumn(filter.setting);
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
