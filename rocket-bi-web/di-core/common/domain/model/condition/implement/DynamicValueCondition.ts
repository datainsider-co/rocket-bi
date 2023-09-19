import { ConditionType, Field, NestedCondition, ValueCondition, ValueControlType, WidgetId } from '@core/common/domain/model';
import { Condition } from '@core/common/domain/model/condition/Condition';
import { cloneDeep } from 'lodash';
import { ListUtils } from '@/utils';

export interface DynamicValueExtraData {
  controlTypes: ValueControlType[];
}

export class DynamicValueCondition extends Condition implements NestedCondition {
  className: ConditionType = ConditionType.Dynamic;
  baseCondition: Condition;
  finalCondition?: Condition;
  dynamicWidgetId: WidgetId;
  extraData!: DynamicValueExtraData;

  constructor(condition: Condition, dynamicWidgetId: WidgetId, finalCondition?: Condition, extraData?: DynamicValueExtraData) {
    super();
    this.baseCondition = condition;
    this.dynamicWidgetId = dynamicWidgetId;
    this.finalCondition = finalCondition;
    this.extraData = extraData ?? { controlTypes: [] };
  }

  getAllFields(): Field[] {
    return this.baseCondition.getAllFields();
  }

  static isDynamicCondition(obj: any & Condition): obj is DynamicValueCondition {
    return obj && obj.className === ConditionType.Dynamic;
  }

  static fromObject(obj: any): DynamicValueCondition {
    const baseCondition: Condition = Condition.fromObject(obj.baseCondition);
    const finalCondition: Condition | undefined = obj.finalCondition ? Condition.fromObject(obj.finalCondition) : void 0;
    return new DynamicValueCondition(baseCondition, obj.dynamicWidgetId, finalCondition, obj.extraData);
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
