/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:24 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:17 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { ConditionData, ConditionFamilyTypes, DateHistogramConditionTypes, InputType } from '@/shared';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { DateRelatedCondition } from '@core/common/domain/model/condition/DateRelatedCondition';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class LastNMonth extends FieldRelatedCondition implements ValueCondition, DateRelatedCondition {
  className = ConditionType.LastNMonth;
  nMonth: string;
  intervalFunction: ScalarFunction | undefined;

  constructor(field: Field, nMonth: string, scalarFunction?: ScalarFunction, intervalFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.nMonth = nMonth;
    this.intervalFunction = intervalFunction;
  }

  static fromObject(obj: LastNMonth): LastNMonth {
    const field = Field.fromObject(obj.field);
    const nMonth = obj.nMonth;
    return new LastNMonth(field, nMonth, getScalarFunction(obj.scalarFunction), getScalarFunction(obj.intervalFunction));
  }

  assignValue(nMonth: string) {
    this.nMonth = nMonth;
  }

  getConditionTypes(): string[] {
    return [ConditionFamilyTypes.dateHistogram, DateHistogramConditionTypes.lastNMonths];
  }

  getValues(): string[] {
    return [this.nMonth];
  }
  setValues(values: string[]) {
    if (ListUtils.isEmpty(values)) {
      throw new DIException('Value is require!');
    }
    this.nMonth = values[0];
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
      subType: DateHistogramConditionTypes.lastNMonths,
      firstValue: this.nMonth,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: DateHistogramConditionTypes.lastNMonths
    };
  }
}
