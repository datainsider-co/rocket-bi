/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:01 PM
 */

import { UserActivitiesResponse } from '@core/common/domain/response/user/UserActivitiesResponse';
import { UserActivity } from '@core/common/domain/response/user/UserActivity';

export class UserDetail {
  userName: string;
  fullName: string;
  firstName: string;
  avatar: string;

  constructor(userName: string, fullName: string, firstName: string, avatar: string) {
    this.userName = userName || '';
    this.fullName = fullName || '';
    this.firstName = firstName || '';
    this.avatar = avatar || '';
  }

  static fromObject(obj: UserDetail): UserDetail {
    return new UserDetail(obj.userName, obj.fullName, obj.firstName, obj.avatar);
  }
}

export class SubActivity extends UserActivitiesResponse {
  constructor(data: UserActivity[], total: number) {
    super(data, total);
  }

  static fromObject(obj: SubActivity): SubActivity {
    return new SubActivity(obj.data, obj.total);
  }
}
