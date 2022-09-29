/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:59 PM
 */

import { QueryState } from '@core/lake-house/domain';

export class ListTableRequest {
  constructor(
    public searchVal?: string,
    public queryState?: QueryState,
    public sortBy?: string,
    public sortMode?: number,
    public from?: number,
    public size?: number,
    public accessType?: number
  ) {}

  static create(from: number, size: number) {
    return new ListTableRequest(void 0, void 0, void 0, void 0, from, size);
  }
}
