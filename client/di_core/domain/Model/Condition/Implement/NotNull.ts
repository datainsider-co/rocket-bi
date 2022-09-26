/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:15 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/domain/Model';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { FieldRelatedCondition } from '@core/domain/Model/Condition/FieldRelatedCondition';
import { ConditionData, InputType, StringConditionTypes } from '@/shared';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';

export class NotNull extends FieldRelatedCondition {
  className = ConditionType.NotNull;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: NotNull): NotNull {
    const field = Field.fromObject(obj.field);
    return new NotNull(field, getScalarFunction(obj.scalarFunction));
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
      subType: StringConditionTypes.notNull,
      firstValue: void 0,
      secondValue: void 0,
      allValues: [],
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: StringConditionTypes.notNull
    };
  }
}
