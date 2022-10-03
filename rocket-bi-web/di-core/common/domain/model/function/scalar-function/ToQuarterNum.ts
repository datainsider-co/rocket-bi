/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class ToQuarterNum extends ScalarFunction {
  className = ScalarFunctionType.ToQuarterNum;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToQuarterNum): ToQuarterNum {
    return new ToQuarterNum(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.quarterOf;
  }
}
