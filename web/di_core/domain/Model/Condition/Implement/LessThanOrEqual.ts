/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:15 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/domain/Model';
import { ValueCondition } from '@core/domain/Model/Condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { ConditionData, ConditionFamilyTypes, InputType, NumberConditionTypes } from '@/shared';
import { FieldRelatedCondition } from '@core/domain/Model/Condition/FieldRelatedCondition';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/domain';

export class LessThanOrEqual extends FieldRelatedCondition implements ValueCondition {
  className = ConditionType.LessThanOrEqual;
  value: string;

  constructor(field: Field, value: string, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.value = value;
  }

  static fromObject(obj: LessThanOrEqual): LessThanOrEqual {
    const field = Field.fromObject(obj.field);
    const value = obj.value;
    return new LessThanOrEqual(field, value, getScalarFunction(obj.scalarFunction));
  }

  assignValue(value: string) {
    this.value = value;
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
  getConditionTypes(): string[] {
    return [ConditionFamilyTypes.number, NumberConditionTypes.lessThanOrEqual];
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
      subType: NumberConditionTypes.lessThanOrEqual,
      firstValue: this.value,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: NumberConditionTypes.lessThanOrEqual
    };
  }
}
