/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:24 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils';
import { ConditionData, DateHistogramConditionTypes, InputType } from '@/shared';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { DateRelatedCondition } from '@core/common/domain/model/condition/DateRelatedCondition';
import { ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class LastNDay extends FieldRelatedCondition implements ValueCondition, DateRelatedCondition {
  className = ConditionType.LastNDay;
  nDay: string;
  intervalFunction: ScalarFunction | undefined;

  constructor(field: Field, nDay: string, scalarFunction?: ScalarFunction, intervalFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.nDay = nDay;
    this.intervalFunction = intervalFunction;
  }

  static fromObject(obj: LastNDay): LastNDay {
    const field = Field.fromObject(obj.field);
    const nDay = obj.nDay;
    return new LastNDay(field, nDay, getScalarFunction(obj.scalarFunction), getScalarFunction(obj.intervalFunction));
  }

  getValues(): string[] {
    return [this.nDay];
  }

  setValues(values: string[]) {
    if (ListUtils.isEmpty(values)) {
      throw new DIException('Value is require!');
    }
    this.nDay = values[0];
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
      subType: DateHistogramConditionTypes.lastNDays,
      firstValue: this.nDay,
      secondValue: void 0,
      allValues: this.getValues(),
      currentInputType: InputType.Text,
      filterModeSelected: FilterMode.Selection,
      currentOptionSelected: DateHistogramConditionTypes.lastNDays
    };
  }

  toString() {
    return `last ${this.nDay} day`;
  }
}
