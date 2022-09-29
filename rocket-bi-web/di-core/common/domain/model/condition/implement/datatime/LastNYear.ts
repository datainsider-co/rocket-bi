/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:24 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { ConditionData, ConditionFamilyTypes, DateHistogramConditionTypes, InputType } from '@/shared';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { DateRelatedCondition } from '@core/common/domain/model/condition/DateRelatedCondition';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class LastNYear extends FieldRelatedCondition implements ValueCondition, DateRelatedCondition {
  className = ConditionType.LastNYear;
  nYear: string;
  intervalFunction: ScalarFunction | undefined;

  constructor(field: Field, nYear: string, scalarFunction?: ScalarFunction, intervalFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.nYear = nYear;
    this.intervalFunction = intervalFunction;
  }

  static fromObject(obj: LastNYear): LastNYear {
    const field = Field.fromObject(obj.field);
    const nYear = obj.nYear;
    return new LastNYear(field, nYear, getScalarFunction(obj.scalarFunction), getScalarFunction(obj.intervalFunction));
  }

  getValues(): string[] {
    return [this.nYear];
  }

  setValues(values: string[]) {
    if (ListUtils.isEmpty(values)) {
      throw new DIException('Value is require!');
    }
    this.nYear = values[0];
  }

  isDateCondition(): boolean {
    return true;
  }

  getConditionTypes(): string[] {
    return [ConditionFamilyTypes.dateHistogram, DateHistogramConditionTypes.lastNYears];
  }

  assignValue(nYear: string) {
    this.nYear = nYear;
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
      subType: DateHistogramConditionTypes.lastNYears,
      firstValue: this.nYear,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: DateHistogramConditionTypes.lastNYears
    };
  }
}
