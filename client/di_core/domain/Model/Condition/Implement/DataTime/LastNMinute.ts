/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:24 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/domain/Model';
import { ValueCondition } from '@core/domain/Model/Condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { ConditionData, ConditionFamilyTypes, DateHistogramConditionTypes, InputType } from '@/shared';
import { FieldRelatedCondition } from '@core/domain/Model/Condition/FieldRelatedCondition';
import { DateRelatedCondition } from '@core/domain/Model/Condition/DateRelatedCondition';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/domain';

export class LastNMinute extends FieldRelatedCondition implements ValueCondition, DateRelatedCondition {
  className = ConditionType.LastNMinute;
  nMinute: string;
  intervalFunction: ScalarFunction | undefined;

  constructor(field: Field, nMinute: string, scalarFunction?: ScalarFunction, intervalFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.nMinute = nMinute;
    this.intervalFunction = intervalFunction;
  }

  static fromObject(obj: LastNMinute): LastNMinute {
    const field = Field.fromObject(obj.field);
    const nMinute = obj.nMinute;
    return new LastNMinute(field, nMinute, getScalarFunction(obj.scalarFunction), getScalarFunction(obj.intervalFunction));
  }

  assignValue(nMinute: string) {
    this.nMinute = nMinute;
  }

  getValues(): string[] {
    return [this.nMinute];
  }

  setValues(values: string[]) {
    if (ListUtils.isEmpty(values)) {
      throw new DIException('Value is require!');
    }
    this.nMinute = values[0];
  }

  isDateCondition(): boolean {
    return true;
  }

  getConditionTypes(): string[] {
    return [ConditionFamilyTypes.dateHistogram, DateHistogramConditionTypes.lastNMinutes];
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
      subType: DateHistogramConditionTypes.lastNMinutes,
      firstValue: this.nMinute,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.text,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: DateHistogramConditionTypes.lastNMinutes
    };
  }
}
