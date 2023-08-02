/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:16 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { ConditionData, ConditionFamilyTypes, InputType, StringConditionTypes } from '@/shared';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class NotLike extends FieldRelatedCondition implements ValueCondition {
  className = ConditionType.NotLike;
  value: string;

  constructor(field: Field, value: string, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.value = value;
  }

  static fromObject(obj: NotLike): NotLike {
    const field = Field.fromObject(obj.field);
    const value = obj.value;
    return new NotLike(field, value, getScalarFunction(obj.scalarFunction));
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
    return [ConditionFamilyTypes.string, StringConditionTypes.notLike];
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
      subType: StringConditionTypes.notLike,
      firstValue: ListUtils.getHead(this.getValues()),
      secondValue: this.getValues()[1],
      allValues: this.getValues(),
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: StringConditionTypes.notLike
    };
  }

  toString() {
    return `not like ${this.value}`;
  }
}
