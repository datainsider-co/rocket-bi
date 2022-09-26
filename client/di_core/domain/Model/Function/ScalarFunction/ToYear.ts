/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:50 PM
 */

import { ScalarFunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';

export class ToYear extends ScalarFunction {
  className = ScalarFunctionType.ToYear;

  constructor(innerFn?: ScalarFunction) {
    super(innerFn);
  }

  static fromObject(obj: ToYear): ToYear {
    return new ToYear(getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.year;
  }
}
