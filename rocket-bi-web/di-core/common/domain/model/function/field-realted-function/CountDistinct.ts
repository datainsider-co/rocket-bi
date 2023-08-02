/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:00 PM
 */

import { Field, FunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { AggregationFunctionTypes, FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';
import { FieldRelatedFunction } from '@core/common/domain/model/function/field-realted-function/FieldRelatedFunction';

export class CountDistinct extends FieldRelatedFunction {
  className = FunctionType.CountDistinct;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: CountDistinct): CountDistinct {
    const field = Field.fromObject(obj.field);
    return new CountDistinct(field, getScalarFunction(obj.scalarFunction));
  }

  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.aggregation, AggregationFunctionTypes.countOfDistinct];
  }
}
