/*
 * @author: tvc12 - Thien Vi
 * @created: 7/9/21, 2:49 PM
 */

import { Field, FunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { AggregationFunctionTypes, FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';
import { FieldRelatedFunction } from '@core/domain/Model/Function/FieldRealtedFunction/FieldRelatedFunction';

export class FirstFunction extends FieldRelatedFunction {
  className = FunctionType.First;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: FirstFunction): FirstFunction {
    const field = Field.fromObject(obj.field);
    return new FirstFunction(field, getScalarFunction(obj.scalarFunction));
  }

  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.aggregation, AggregationFunctionTypes.First];
  }
}
