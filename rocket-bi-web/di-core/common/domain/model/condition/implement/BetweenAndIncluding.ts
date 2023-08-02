/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:16 PM
 */

import { ConditionType, Field, FilterMode, ScalarFunction } from '@core/common/domain/model';
import { ValueCondition } from '@core/common/domain/model/condition/ValueCondition';
import { ConditionUtils, getScalarFunction } from '@core/utils/index';
import { ConditionData, ConditionFamilyTypes, DateHistogramConditionTypes, InputType } from '@/shared';
import { FieldRelatedCondition } from '@core/common/domain/model/condition/FieldRelatedCondition';
import { RandomUtils, SchemaUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class BetweenAndIncluding extends FieldRelatedCondition implements ValueCondition {
  className = ConditionType.BetweenAndIncluding;
  min: string;
  max: string;

  constructor(field: Field, min: string, max: string, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
    this.min = min;
    this.max = max;
  }

  static fromObject(obj: BetweenAndIncluding): BetweenAndIncluding {
    const field = Field.fromObject(obj.field);
    const min = obj.min;
    const max = obj.max;
    return new BetweenAndIncluding(field, min, max, getScalarFunction(obj.scalarFunction));
  }

  assignValue(min: string, max: string) {
    this.min = min;
    this.max = max;
  }

  getValues(): string[] {
    return [this.min, this.max];
  }

  setValues(values: string[]) {
    if (values.length < 2) {
      throw new DIException('Filter not support with one value');
    }
    this.min = values[0];
    this.max = values[1];
  }

  getConditionTypes(): string[] {
    return [ConditionFamilyTypes.dateHistogram, DateHistogramConditionTypes.betweenAndIncluding];
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
      subType: DateHistogramConditionTypes.betweenAndIncluding,
      firstValue: this.min,
      secondValue: this.max,
      allValues: this.getValues(),
      currentInputType: InputType.dateRange,
      filterModeSelected: FilterMode.selection,
      currentOptionSelected: DateHistogramConditionTypes.betweenAndIncluding
    };
  }

  toString() {
    return `between and including ${this.min}-${this.max}`;
  }
}
