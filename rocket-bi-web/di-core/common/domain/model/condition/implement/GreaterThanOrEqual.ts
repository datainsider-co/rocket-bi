/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:15 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { ConditionData, ConditionFamilyTypes, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class GreaterThanOrEqual extends FieldRelatedCondition implements ValueCondition {
  className = ConditionType.GreaterThanOrEqual;
  value: string;

  constructor(field: Field, value: string, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.value = value;
  }

  static fromObject(obj: GreaterThanOrEqual): GreaterThanOrEqual {
    const field = Field.fromObject(obj.field);
    const value = obj.value;
    return new GreaterThanOrEqual(field, value, getScalarFunction(obj.scalarFunction));
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
      subType: this.getSubType(familyType),
      firstValue: this.value,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: this.getSubType(familyType)
    };
  }

  private getSubType(familyType: ConditionFamilyTypes | string): string {
    switch (familyType) {
      case ConditionFamilyTypes.number:
        return NumberConditionTypes.greaterThanOrEqual;
      default:
        return '';
    }
  }

  toString() {
    return `greater than or equal ${this.value}`;
  }
}
