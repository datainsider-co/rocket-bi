/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class ToDayOfWeek extends ScalarFunction {
  className = ScalarFunctionType.ToDayOfWeek;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToDayOfWeek): ToDayOfWeek {
    return new ToDayOfWeek(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.dayOfWeek;
  }
}
