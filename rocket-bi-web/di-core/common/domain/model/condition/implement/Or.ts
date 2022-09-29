/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:14 PM
 */

import { ConditionType, NestedCondition, Field } from '@core/common/domain/model';
import { Condition } from '@core/common/domain/model/condition/Condition';

export class Or extends Condition implements NestedCondition {
  className = ConditionType.Or;
  conditions: Condition[];

  constructor(conditions: Condition[]) {
    super();
    this.conditions = conditions;
  }

  getAllFields(): Field[] {
    let fields: Field[] = [];
    this.conditions.forEach(cond => {
      fields = fields.concat(cond.getAllFields());
    });
    return fields;
  }

  static fromObject(obj: Or): Or {
    const conditions: Condition[] = obj.conditions?.map(o => Condition.fromObject(o)) || [];
    return new Or(conditions);
  }

  getConditions(): Condition[] {
    return this.conditions;
  }
}
