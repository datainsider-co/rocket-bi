/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:13 PM
 */

import { ConditionType, NestedCondition, Field, Id, FilterMode } from '@core/domain/Model';
import { Condition } from '@core/domain/Model/Condition/Condition';
import { ConditionData, InputType } from '@/shared';
import { ListUtils } from '@/utils';

export class And extends Condition implements NestedCondition {
  className = ConditionType.And;
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

  static fromObject(obj: And): And {
    const conditions: Condition[] = obj.conditions?.map(o => Condition.fromObject(o)) ?? [];
    return new And(conditions);
  }

  getConditions(): Condition[] {
    return this.conditions;
  }
}
