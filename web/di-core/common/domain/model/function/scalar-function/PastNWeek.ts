/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class PastNWeek extends ScalarFunction {
  className = ScalarFunctionType.PastNWeek;
  nWeek: number;

  constructor(nWeek: number, innerFn?: ScalarFunction) {
    super(innerFn);
    this.nWeek = nWeek;
  }

  static fromObject(obj: PastNWeek): PastNWeek {
    return new PastNWeek(obj.nWeek, getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.weekOf;
  }
}
