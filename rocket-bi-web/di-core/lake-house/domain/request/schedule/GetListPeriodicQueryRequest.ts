/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 3:22 PM
 */

import { PeriodicQueryStatus } from '@core/lake-house/domain';

export class GetListPeriodicQueryRequest {
  constructor(
    public sortBy?: string,
    public sortMode?: number,
    public from?: number,
    public size?: number,
    public queryStatus?: PeriodicQueryStatus,
    public ownerQueryId?: string,
    public searchVal?: string
  ) {}
}
