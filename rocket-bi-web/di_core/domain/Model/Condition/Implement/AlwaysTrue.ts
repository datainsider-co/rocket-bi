import { Condition } from '@core/domain/Model/Condition/Condition';
import { ConditionType } from '@core/domain';

export class AlwaysTrue extends Condition {
  className: ConditionType = ConditionType.AlwaysTrue;

  constructor() {
    super();
  }

  static fromObject(obj: AlwaysTrue) {
    return new AlwaysTrue();
  }
}
