/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:00 PM
 */

import { Field, FunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';
import { FieldRelatedFunction } from '@core/common/domain/model/function/field-realted-function/FieldRelatedFunction';

export class Select extends FieldRelatedFunction {
  className = FunctionType.Select;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: Select): Select {
    const field = Field.fromObject(obj.field);
    return new Select(field, getScalarFunction(obj.scalarFunction));
  }

  getFunctionTypes(): [string, string] {
    return [FunctionFamilyTypes.none, ''];
  }
}
