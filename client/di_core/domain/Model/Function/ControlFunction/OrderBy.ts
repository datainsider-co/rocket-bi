/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:14 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:01 PM
 */

import { SortDirection } from '@core/domain/Request';
import { ClassNotFound } from '@core/domain/Exception/ClassNotFound';
import { ControlFunction } from '@core/domain/Model/Function/ControlFunction/ControlFunction';
import { FieldRelatedFunction, FunctionType } from '@core/domain/Model';
import { Function } from '@core/domain/Model/Function/Function';

export class OrderBy extends ControlFunction {
  className = FunctionType.OrderBy;
  function!: FieldRelatedFunction;
  order: SortDirection = SortDirection.Asc;
  numElemsShown?: number | null;

  constructor(func: FieldRelatedFunction, order: SortDirection, numElemsShown?: number | null) {
    super();
    this.function = func;
    this.order = order;
    // TODO: remove numElemsShown
    this.numElemsShown = numElemsShown || void 0;
  }

  static fromObject(obj: OrderBy): OrderBy {
    const func = Function.fromObject(obj.function);
    if (func instanceof FieldRelatedFunction) {
      return new OrderBy(func, obj.order, obj.numElemsShown);
    } else {
      throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }
}
