/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class ToMonthNum extends ScalarFunction {
  className = ScalarFunctionType.ToMonthNum;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToMonthNum): ToMonthNum {
    return new ToMonthNum(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.monthOf;
  }
}
