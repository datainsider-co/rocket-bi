import { Condition } from '@core/common/domain/model/condition/Condition';
import { ConditionType } from '@core/common/domain';

export class AlwaysFalse extends Condition {
  className: ConditionType = ConditionType.AlwaysFalse;

  constructor() {
    super();
  }

  static fromObject(obj: AlwaysFalse) {
    return new AlwaysFalse();
  }
}
