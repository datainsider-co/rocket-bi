/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:17 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { ConditionData, ConditionTypes, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class NotIn extends FieldRelatedCondition implements ValueCondition {
  className = ConditionType.NotIn;
  possibleValues: string[];

  constructor(field: Field, possibleValues: string[], scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.possibleValues = possibleValues;
  }

  static fromObject(obj: NotIn): NotIn {
    const field = Field.fromObject(obj.field);
    const possibleValues: string[] = obj.possibleValues;
    return new NotIn(field, possibleValues, getScalarFunction(obj.scalarFunction));
  }

  getValues(): string[] {
    return this.possibleValues;
  }
  setValues(values: string[]) {
    if (ListUtils.isEmpty(values)) {
      throw new DIException('Value is require!');
    }
    this.possibleValues = values;
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
      firstValue: ListUtils.getHead(this.getValues()),
      secondValue: this.getValues()[1],
      allValues: this.getValues(),
      currentInputType: InputType.Text,
      filterModeSelected: FilterMode.Selection,
      currentOptionSelected: this.getSubType(familyType)
    };
  }

  private getSubType(familyType: ConditionTypes | string): string {
    switch (familyType) {
      case ConditionTypes.Number:
        return NumberConditionTypes.notIn;
      case ConditionTypes.String:
        return StringConditionTypes.notEqual;
      default:
        return '';
    }
  }

  toString() {
    const valuesAsString = this.possibleValues.join(', ');
    return `not in ${valuesAsString}`;
  }
}
