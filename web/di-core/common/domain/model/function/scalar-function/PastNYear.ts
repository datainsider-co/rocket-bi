/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class PastNYear extends ScalarFunction {
  className = ScalarFunctionType.PastNYear;
  nYear: number;

  constructor(nYear: number, innerFn?: ScalarFunction) {
    super(innerFn);
    this.nYear = nYear;
  }

  static fromObject(obj: PastNYear): PastNYear {
    return new PastNYear(obj.nYear, getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.year;
  }
}
