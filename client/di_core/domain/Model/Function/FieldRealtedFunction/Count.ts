/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:57 PM
 */

import { FunctionType } from '@core/domain/Model/Function';
import { AggregationFunctionTypes, FunctionFamilyTypes } from '@/shared';
import { getScalarFunction } from '@core/utils/function.utils';
import { Field } from '@core/domain/Model/Function/Field';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';
import { FieldRelatedFunction } from '@core/domain/Model/Function/FieldRealtedFunction/FieldRelatedFunction';

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
