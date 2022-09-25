/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:02 PM
 */

import { UserActivity } from '@core/domain';
import { PageResult } from '@core/domain/Response/PageResult';

export class UserActivitiesResponse extends PageResult<UserActivity> {
  constructor(data: UserActivity[], total: number) {
    super(data, total);
  }

  static fromObject(obj: UserActivitiesResponse): UserActivitiesResponse {
    return new UserActivitiesResponse(obj.data, obj.total);
  }
}
