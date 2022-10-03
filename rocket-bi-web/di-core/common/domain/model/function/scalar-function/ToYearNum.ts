/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class ToYearNum extends ScalarFunction {
  className = ScalarFunctionType.ToYearNum;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToYearNum): ToYearNum {
    return new ToYearNum(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.yearlyOf;
  }
}
