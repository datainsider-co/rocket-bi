/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:14 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { ConditionData, DateHistogramConditionTypes, InputType, StringConditionTypes } from '@/shared';
import { RandomUtils, SchemaUtils } from '@/utils';

export class Empty extends FieldRelatedCondition {
  className = ConditionType.IsEmpty;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: Empty): Empty {
    const field = Field.fromObject(obj.field);
    const scalarFunction = getScalarFunction(obj.scalarFunction);
    return new Empty(field, scalarFunction);
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
      subType: StringConditionTypes.isEmpty,
      firstValue: void 0,
      secondValue: void 0,
      allValues: [],
      currentInputType: InputType.none,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: StringConditionTypes.isEmpty
    };
  }
}
