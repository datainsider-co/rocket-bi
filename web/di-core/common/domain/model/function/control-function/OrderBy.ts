/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:14 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:01 PM
 */

import { SortDirection } from '@core/common/domain/request';
import { ClassNotFound } from '@core/common/domain/exception/ClassNotFound';
import { ControlFunction } from '@core/common/domain/model/function/control-function/ControlFunction';
import { FieldRelatedFunction, FunctionType } from '@core/common/domain/model';
import { Function } from '@core/common/domain/model/function/Function';

export class OrderBy extends ControlFunction {
  className = FunctionType.OrderBy;
  function!: Function;
  order: SortDirection = SortDirection.Asc;
  numElemsShown?: number | null;

  constructor(func: Function, order: SortDirection, numElemsShown?: number | null) {
    super();
    this.function = func;
    this.order = order;
    // TODO: remove numElemsShown
    this.numElemsShown = numElemsShown || void 0;
  }

  static fromObject(obj: OrderBy): OrderBy {
    const func = Function.fromObject(obj.function);
    return new OrderBy(func, obj.order, obj.numElemsShown);
  }

  withFunction(func: Function): OrderBy {
    this.function = func;
    return this;
  }
}
