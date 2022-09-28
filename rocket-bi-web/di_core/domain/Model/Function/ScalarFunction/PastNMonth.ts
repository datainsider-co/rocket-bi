/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';

export class PastNMonth extends ScalarFunction {
  className = ScalarFunctionType.PastNMonth;
  nMonth: number;

  constructor(nMonth: number, innerFn?: ScalarFunction) {
    super(innerFn);
    this.nMonth = nMonth;
  }

  static fromObject(obj: PastNMonth): PastNMonth {
    return new PastNMonth(obj.nMonth, getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.monthOfYear;
  }
}
