/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 6:04 PM
 */

import { SortDirection } from '@core/domain';

export class GetListFileRequest {
  constructor(
    readonly path: string,
    readonly search = '',
    readonly from?: number,
    readonly size?: number,
    readonly sortBy?: string,
    readonly sortMode?: number,
    readonly type?: string
  ) {}

  static fromSortDirection(
    path: string,
    search = '',
    from?: number,
    size?: number,
    sortBy?: string,
    sortDirection?: SortDirection,
    type?: string
  ): GetListFileRequest {
    const sortMode = sortDirection === SortDirection.Asc ? 1 : 0;
    return new GetListFileRequest(path, search, from, size, sortBy, sortMode, type);
  }
}
