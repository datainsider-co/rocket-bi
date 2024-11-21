import { Field, ScalarFunction, WidgetId } from '@core/common/domain/model';
import { Condition } from './Condition';
import { ConditionData } from '@/shared';

export abstract class FieldRelatedCondition extends Condition {
  field!: Field;
  scalarFunction?: ScalarFunction;

  abstract toConditionData(groupId: number): ConditionData;

  protected constructor(field: Field, scalarFunction?: ScalarFunction) {
    super();
    this.field = field;
    this.scalarFunction = scalarFunction;
  }

  getAllFields(): Field[] {
    return [this.field];
  }

  static isFieldRelatedCondition(obj: any & FieldRelatedCondition): obj is FieldRelatedCondition {
    return !!obj?.field;
  }

  setScalarFunction(scalarFunction: ScalarFunction): FieldRelatedCondition {
    this.scalarFunction = scalarFunction;
    return this;
  }
}
