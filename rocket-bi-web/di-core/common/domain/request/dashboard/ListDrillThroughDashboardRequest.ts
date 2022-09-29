/*
 * @author: tvc12 - Thien Vi
 * @created: 9/14/21, 3:44 PM
 */

import { DashboardId, Field } from '@core/common/domain';

export class ListDrillThroughDashboardRequest {
  constructor(readonly excludeIds: DashboardId[], readonly fields: Field[], readonly from = 0, readonly size = 1000, readonly isRemoved = false) {}
}
