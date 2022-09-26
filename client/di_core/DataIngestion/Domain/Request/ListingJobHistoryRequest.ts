/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 3:05 PM
 */

import { SortRequest } from '@core/DataIngestion';

export class ListingJobHistoryRequest {
  from: number;
  size: number;
  sorts: SortRequest[];

  constructor(from: number, size: number, sorts: SortRequest[] = []) {
    this.from = from;
    this.size = size;
    this.sorts = sorts;
  }
}
