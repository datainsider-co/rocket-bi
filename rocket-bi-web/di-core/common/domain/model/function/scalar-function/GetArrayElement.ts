/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:52 PM
 */

import { ScalarFunctionType } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';

export class GetArrayElement extends ScalarFunction {
  private static DEFAULT_INDEX = 1;
  className = ScalarFunctionType.GetArrayElement;
  index?: number;

  constructor(index?: number, innerFn?: ScalarFunction) {
    super(innerFn);
    this.index = index ?? GetArrayElement.DEFAULT_INDEX;
  }

  static fromObject(obj: GetArrayElement): GetArrayElement {
    return new GetArrayElement(obj.index, getScalarFunction(obj.innerFn));
  }

  getFunctionType(): string {
    return '';
  }
}
