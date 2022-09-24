/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:00 PM
 */

import { Field, FunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';
import { FieldRelatedFunction } from '@core/domain/Model/Function/FieldRealtedFunction/FieldRelatedFunction';

export class SelectDistinct extends FieldRelatedFunction {
  className = FunctionType.SelectDistinct;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: SelectDistinct): SelectDistinct {
    const field = Field.fromObject(obj.field);
    return new SelectDistinct(field, getScalarFunction(obj.scalarFunction));
  }

  //TODO: take care
  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.none, ''];
  }
}
