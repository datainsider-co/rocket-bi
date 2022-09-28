/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:52 PM
 */

import { ScalarFunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';

export class ToMinuteNum extends ScalarFunction {
  className = ScalarFunctionType.ToMinuteNum;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToMinuteNum): ToMinuteNum {
    return new ToMinuteNum(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.minuteOf;
  }
}
