/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:16 PM
 */

import { ConditionType, Field } from '@core/common/domain/model';
import { Condition } from '@core/common/domain/model/condition/Condition';

export class EqualField extends Condition {
  className = ConditionType.EqualField;
  leftField: Field;
  rightField: Field;

  constructor(leftField: Field, rightField: Field) {
    super();
    this.leftField = leftField;
    this.rightField = rightField;
  }

  getAllFields(): Field[] {
    return [this.leftField, this.rightField];
  }

  static fromObject(obj: EqualField): EqualField {
    const leftField = Field.fromObject(obj.leftField);
    const rightField = Field.fromObject(obj.rightField);
    return new EqualField(leftField, rightField);
  }

  assignValue(rightField: Field) {
    this.rightField = rightField;
  }
}
