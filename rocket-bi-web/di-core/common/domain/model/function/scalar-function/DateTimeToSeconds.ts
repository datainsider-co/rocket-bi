/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:52 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class DateTimeToSeconds extends ScalarFunction {
  className = ScalarFunctionType.DateTimeToSeconds;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: DateTimeToSeconds): DateTimeToSeconds {
    return new DateTimeToSeconds(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.dynamic;
  }
}
