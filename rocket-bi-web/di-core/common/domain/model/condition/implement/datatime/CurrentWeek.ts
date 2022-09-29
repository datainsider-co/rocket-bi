/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:23 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { ConditionData, ConditionFamilyTypes, DateHistogramConditionTypes, InputType } from '@/shared';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { DateRelatedCondition } from '@core/common/domain/model/condition/DateRelatedCondition';
import { RandomUtils, SchemaUtils } from '@/utils';

export class CurrentWeek extends FieldRelatedCondition implements ValueCondition, DateRelatedCondition {
  className = ConditionType.CurrentWeek;
  intervalFunction: ScalarFunction | undefined;

  constructor(field: Field, scalarFunction?: ScalarFunction, intervalFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: CurrentWeek): CurrentWeek {
    const field = Field.fromObject(obj.field);
    return new CurrentWeek(field, getScalarFunction(obj.scalarFunction), getScalarFunction(obj.intervalFunction));
  }

  assignValue() {
    // do nothing
  }

  getConditionTypes(): string[] {
    return [ConditionFamilyTypes.dateHistogram, DateHistogramConditionTypes.currentWeek];
  }

  getValues(): string[] {
    return [];
  }

  setValues(values: string[]) {
    //
  }
  isDateCondition(): boolean {
    return true;
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
      subType: DateHistogramConditionTypes.currentWeek,
      firstValue: void 0,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.none,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: DateHistogramConditionTypes.currentWeek
    };
  }
}
