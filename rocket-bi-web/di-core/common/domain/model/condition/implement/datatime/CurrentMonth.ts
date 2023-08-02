/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:19 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:09 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';

import { ConditionData, ConditionFamilyTypes, DateHistogramConditionTypes, InputType } from '@/shared';
import { getScalarFunction } from '@core/utils/FunctionDataUtils';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { DateRelatedCondition } from '@core/common/domain/model/condition/DateRelatedCondition';
import { ConditionUtils } from '@core/utils';
import { RandomUtils, SchemaUtils } from '@/utils';

export class CurrentMonth extends FieldRelatedCondition implements ValueCondition, DateRelatedCondition {
  className = ConditionType.CurrentMonth;
  intervalFunction: ScalarFunction | undefined;

  constructor(field: Field, scalarFunction?: ScalarFunction, intervalFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.intervalFunction = intervalFunction;
  }

  static fromObject(obj: CurrentMonth): CurrentMonth {
    const field = Field.fromObject(obj.field);
    return new CurrentMonth(field, getScalarFunction(obj.scalarFunction), getScalarFunction(obj.intervalFunction));
  }

  assignValue() {
    // do nothing
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

  getConditionTypes(): string[] {
    return [ConditionFamilyTypes.dateHistogram, DateHistogramConditionTypes.currentMonth];
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
      subType: DateHistogramConditionTypes.currentMonth,
      firstValue: void 0,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.none,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: DateHistogramConditionTypes.currentMonth
    };
  }
  toString() {
    return 'current month';
  }
}
