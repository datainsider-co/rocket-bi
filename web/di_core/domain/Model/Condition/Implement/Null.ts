/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:14 PM
 */

import { ConditionType, Field, FilterMode, Id, ScalarFunction } from '@core/domain/Model';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { FieldRelatedCondition } from '@core/domain/Model/Condition/FieldRelatedCondition';
import { ConditionData, InputType, StringConditionTypes } from '@/shared';
import { ChartUtils, RandomUtils, SchemaUtils } from '@/utils';

export class Null extends FieldRelatedCondition {
  className = ConditionType.IsNull;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: Null): Null {
    const field = Field.fromObject(obj.field);
    const scalarFunction = getScalarFunction(obj.scalarFunction);
    return new Null(field, scalarFunction);
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
      subType: StringConditionTypes.isnull,
      firstValue: void 0,
      secondValue: void 0,
      allValues: [],
      currentInputType: InputType.none,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: StringConditionTypes.isnull
    };
  }
}
