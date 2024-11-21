/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:52 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class ToHourNum extends ScalarFunction {
  className = ScalarFunctionType.ToHourNum;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToHourNum): ToHourNum {
    return new ToHourNum(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.hourOf;
  }
}
