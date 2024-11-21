/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class PastNDay extends ScalarFunction {
  className = ScalarFunctionType.PastNDay;
  nDay: number;

  constructor(nDay: number, innerFn?: ScalarFunction) {
    super(innerFn);
    this.nDay = nDay;
  }

  static fromObject(obj: PastNDay): PastNDay {
    return new PastNDay(obj.nDay, getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.dayOfMonth;
  }
}
