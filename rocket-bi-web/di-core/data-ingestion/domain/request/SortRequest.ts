/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 3:06 PM
 */

import { SortDirection } from '@core/common/domain';

export class SortRequest {
  field: string;
  order: SortDirection;

  constructor(field: string, order: SortDirection) {
    this.field = field;
    this.order = order;
  }
}
