/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';

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
