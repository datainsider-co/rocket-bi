/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:50 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

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
