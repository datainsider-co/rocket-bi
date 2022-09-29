import { ConditionType, Field, NestedCondition, ValueCondition, WidgetId } from '@core/common/domain/model';
import { Condition } from '@core/common/domain/model/condition/Condition';
import { cloneDeep } from 'lodash';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';

export class DynamicValueCondition extends Condition implements NestedCondition {
  className: ConditionType = ConditionType.Dynamic;
  baseCondition: Condition;
  finalCondition?: Condition;
  dynamicWidgetId: WidgetId;
  displayName: string;

  constructor(condition: Condition, dynamicWidgetId: WidgetId, displayName: string, finalCondition?: Condition) {
    super();
    this.baseCondition = condition;
    this.dynamicWidgetId = dynamicWidgetId;
    this.displayName = displayName;
    this.finalCondition = finalCondition;
  }

  getAllFields(): Field[] {
    return this.baseCondition.getAllFields();
  }

  static isDynamicCondition(obj: any & Condition): obj is DynamicValueCondition {
    return !!obj?.dynamicWidgetId;
  }

  static fromObject(obj: any): DynamicValueCondition {
    const baseCondition = Condition.fromObject(obj.baseCondition);
    const finalCondition = obj.finalCondition ? Condition.fromObject(obj.finalCondition) : void 0;
    return new DynamicValueCondition(baseCondition, obj.dynamicWidgetId, obj.displayName, finalCondition);
  }

  getConditions(): Condition[] {
    return [this.baseCondition];
  }

  withValues(values: string[]): DynamicValueCondition {
    if (ValueCondition.isValueCondition(this.baseCondition) && ListUtils.isNotEmpty(values)) {
      const finalCondition: ValueCondition = cloneDeep(this.baseCondition);
      finalCondition.setValues(values);
      this.finalCondition = finalCondition as any;
    } else if (ListUtils.isEmpty(values)) {
      this.finalCondition = void 0;
    }
    return this;
  }
}
