/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:51 PM
 */

import { ScalarFunctionType } from '@core/domain/Model';
import { getScalarFunction } from '@core/utils';
import { DateFunctionTypes } from '@/shared';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';

export class PastNQuarter extends ScalarFunction {
  className = ScalarFunctionType.PastNQuarter;
  nQuarter: number;

  constructor(nQuarter: number, innerFn?: ScalarFunction) {
    super(innerFn);
    this.nQuarter = nQuarter;
  }

  static fromObject(obj: PastNQuarter): PastNQuarter {
    return new PastNQuarter(obj.nQuarter, getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return DateFunctionTypes.quarterOfYear;
  }
}
