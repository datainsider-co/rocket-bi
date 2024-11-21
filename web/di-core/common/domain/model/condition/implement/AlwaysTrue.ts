import { Condition } from '@core/common/domain/model/condition/Condition';
import { ConditionType } from '@core/common/domain';

export class AlwaysTrue extends Condition {
  className: ConditionType = ConditionType.AlwaysTrue;

  constructor() {
    super();
  }

  static fromObject(obj: AlwaysTrue) {
    return new AlwaysTrue();
  }
}
