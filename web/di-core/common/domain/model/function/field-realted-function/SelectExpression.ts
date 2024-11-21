/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:01 PM
 */

import { ExpressionField, Field, FunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { AggregationFunctionTypes, FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';
import { FieldRelatedFunction } from '@core/common/domain/model/function/field-realted-function/FieldRelatedFunction';

export class SelectExpression extends FieldRelatedFunction {
  className = FunctionType.Expression;

  constructor(field: ExpressionField, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: SelectExpression): SelectExpression {
    const field = Field.fromObject(obj.field) as ExpressionField;
    return new SelectExpression(field, getScalarFunction(obj.scalarFunction));
  }

  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.aggregation, AggregationFunctionTypes.Expression];
  }
}
