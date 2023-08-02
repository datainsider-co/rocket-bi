/*
 * @author: tvc12 - Thien Vi
 * @created: 7/9/21, 2:49 PM
 */

import { Field, FunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { AggregationFunctionTypes, FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';
import { FieldRelatedFunction } from '@core/common/domain/model/function/field-realted-function/FieldRelatedFunction';

export class LastFunction extends FieldRelatedFunction {
  className = FunctionType.Last;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: LastFunction): LastFunction {
    const field = Field.fromObject(obj.field);
    return new LastFunction(field, getScalarFunction(obj.scalarFunction));
  }

  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.aggregation, AggregationFunctionTypes.Last];
  }
}
