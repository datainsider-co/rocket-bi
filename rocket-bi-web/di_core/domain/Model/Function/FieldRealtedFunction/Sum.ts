/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:01 PM
 */

import { Field, FunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { AggregationFunctionTypes, FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';
import { FieldRelatedFunction } from '@core/domain/Model/Function/FieldRealtedFunction/FieldRelatedFunction';

export class Sum extends FieldRelatedFunction {
  className = FunctionType.Sum;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: Sum): Sum {
    const field = Field.fromObject(obj.field);
    return new Sum(field, getScalarFunction(obj.scalarFunction));
  }

  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.aggregation, AggregationFunctionTypes.sum];
  }
}
