import { Condition } from '@core/domain/Model/Condition/Condition';
import { ConditionType } from '@core/domain';

export class AlwaysFalse extends Condition {
  className: ConditionType = ConditionType.AlwaysFalse;

  constructor() {
    super();
  }

  static fromObject(obj: AlwaysFalse) {
    return new AlwaysFalse();
  }
}
