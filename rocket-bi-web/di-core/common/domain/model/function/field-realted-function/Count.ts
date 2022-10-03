/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:57 PM
 */

import { FunctionType } from '@core/common/domain/model/function';
import { AggregationFunctionTypes, FunctionFamilyTypes } from '@/shared';
import { getScalarFunction } from '@core/utils/FunctionDataUtils';
import { Field } from '@core/common/domain/model/function/Field';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';
import { FieldRelatedFunction } from '@core/common/domain/model/function/field-realted-function/FieldRelatedFunction';

export class Count extends FieldRelatedFunction {
  className = FunctionType.Count;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: Count): Count {
    const field = Field.fromObject(obj.field);
    return new Count(field, getScalarFunction(obj.scalarFunction));
  }

  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.aggregation, AggregationFunctionTypes.countAll];
  }
}
