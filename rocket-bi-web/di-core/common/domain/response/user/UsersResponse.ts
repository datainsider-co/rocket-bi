/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:10 PM
 */

import { UserProfile } from '@core/common/domain';
import { PageResult } from '@core/common/domain/response/PageResult';

export class UsersResponse extends PageResult<UserProfile> {
  constructor(data: UserProfile[], total: number) {
    super(data, total);
  }

  static fromObject(obj: any): UsersResponse {
    return new UsersResponse(obj.data, obj.total);
  }
}
