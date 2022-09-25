/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';

export class ToQuarter extends ScalarFunction {
  className = ScalarFunctionType.ToQuarter;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToQuarter): ToQuarter {
    return new ToQuarter(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.quarterOfYear;
  }
}
