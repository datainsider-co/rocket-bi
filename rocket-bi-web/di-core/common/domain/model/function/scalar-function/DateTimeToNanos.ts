/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:52 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class DateTimeToNanos extends ScalarFunction {
  className = ScalarFunctionType.DateTimeToNanos;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: DateTimeToNanos): DateTimeToNanos {
    return new DateTimeToNanos(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.dynamic;
  }
}
