import { SortDirection } from '@core/common/domain';

export class SortRequest {
  field: string;
  order: SortDirection;

  constructor(field: string, order: SortDirection) {
    this.field = field;
    this.order = order;
  }
}
