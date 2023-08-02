/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:15 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { ConditionData, ConditionFamilyTypes, DateHistogramConditionTypes, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class LessThan extends FieldRelatedCondition implements ValueCondition {
  className = ConditionType.LessThan;
  value: string;

  constructor(field: Field, value: string, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.value = value;
  }

  static fromObject(obj: LessThan): LessThan {
    const field = Field.fromObject(obj.field);
    const value = obj.value;
    return new LessThan(field, value, getScalarFunction(obj.scalarFunction));
  }

  getValues(): string[] {
    return [this.value];
  }

  setValues(values: string[]) {
    if (ListUtils.isEmpty(values)) {
      throw new DIException('Value is require!');
    }
    this.value = values[0];
  }

  toConditionData(groupId: number): ConditionData {
    const familyType = ConditionUtils.getFamilyTypeFromFieldType(this.field.fieldType) as string;
    return {
      id: RandomUtils.nextInt(),
      groupId: groupId,
      field: this.field,
      tableName: this.field.tblName,
      columnName: this.field.fieldName,
      isNested: SchemaUtils.isNested(this.field.tblName),
      familyType: familyType,
      subType: NumberConditionTypes.lessThan,
      firstValue: this.value,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: NumberConditionTypes.lessThan
    };
  }

  toString() {
    return `less than ${this.value}`;
  }
}
