/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:14 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:01 PM
 */

import { FunctionType } from '@core/common/domain/model';
import { ControlFunction } from '@core/common/domain/model/function/control-function/ControlFunction';

export class Limit extends ControlFunction {
  className = FunctionType.Limit;
  offset!: number;
  size!: number;

  constructor(offset: number, size: number) {
    super();
    this.offset = offset;
    this.size = size;
  }

  static fromObject(obj: Limit): Limit {
    return new Limit(obj.offset, obj.size);
  }
}
