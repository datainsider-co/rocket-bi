/*
 * @author: tvc12 - Thien Vi
 * @created: 7/20/21, 3:03 PM
 */

import { DashboardId, DirectoryId, DirectoryType, Sort } from '@core/common/domain';

export class ListDirectoryRequest {
  parentId?: DirectoryId;
  ownerId?: string;
  isRemoved?: boolean;
  dashboardId?: DashboardId;
  directoryType?: DirectoryType;
  sorts: Sort[] = [];
  from = 0;
  size = 1000;

  constructor(data?: {
    parentId?: DirectoryId;
    ownerId?: string;
    isRemoved?: boolean;
    dashboardId?: DashboardId;
    directoryType?: DirectoryType;
    sorts?: Sort[];
    from?: number;
    size?: number;
  }) {
    Object.assign(this, data);
  }
}
