import { And, Condition, Equal, FieldRelatedCondition, In, QuerySetting, TableColumn, WidgetId } from '@core/domain/Model';
import { FilterUtils } from '@/utils';
import { ConditionUtils } from '@core/utils';
import { SlicerRange } from '@/shared';

export class FilterRequest {
  filterId!: WidgetId;
  condition!: FieldRelatedCondition | Condition;
  isApplyRelatively = true;
  isActive = true;

  constructor(filterId: WidgetId, condition: FieldRelatedCondition | Condition, isApplyRelatively = true, isActive = true) {
    this.filterId = filterId;
    this.condition = condition;
    this.isApplyRelatively = isApplyRelatively;
    this.isActive = isActive;
  }

  static fromObject(object: FilterRequest): FilterRequest {
    const condition = Condition.fromObject(object.condition);
    return new FilterRequest(object.filterId, condition, object.isApplyRelatively, object.isActive);
  }

  static fromCondition(condition: FieldRelatedCondition | Condition, id: WidgetId = -1, isApplyRelatively = true, isActive = true) {
    return new FilterRequest(id, condition, isApplyRelatively, isActive);
  }

  static fromValue(id: WidgetId, querySetting: QuerySetting, value: string): FilterRequest | undefined {
    const filterColumn: TableColumn | undefined = FilterUtils.getFilterColumn(querySetting);
    if (filterColumn) {
      const condition: Equal = ConditionUtils.buildEqualCondition(filterColumn, value);
      return new FilterRequest(id, condition);
    } else {
      return void 0;
    }
  }

  static fromValues(id: WidgetId, querySetting: QuerySetting, values: string[]): FilterRequest | undefined {
    const filterColumn: TableColumn | undefined = FilterUtils.getFilterColumn(querySetting);
    if (filterColumn) {
      const condition: In = ConditionUtils.buildInCondition(filterColumn, values);
      return new FilterRequest(id, condition);
    } else {
      return void 0;
    }
  }

  static fromSlicerRangeValue(id: WidgetId, querySetting: QuerySetting, range: SlicerRange): FilterRequest | undefined {
    const filterColumn: TableColumn | undefined = FilterUtils.getFilterColumn(querySetting);
    if (filterColumn) {
      const { from, to } = range;
      const fromCondition: Condition = ConditionUtils.buildFromCondition(filterColumn, from);
      const toCondition: Condition = ConditionUtils.buildToCondition(filterColumn, to);
      const andCondition: And = new And([fromCondition, toCondition]);
      return new FilterRequest(id, andCondition);
    } else {
      return void 0;
    }
  }
}
