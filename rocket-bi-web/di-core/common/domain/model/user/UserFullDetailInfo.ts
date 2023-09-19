import { UserInfo } from '@core/common/domain/model/user/UserInfo';
import { UserProfile } from '@core/common/domain/model/user/UserProfile';
import { UserGroup } from './UserGroup';

export class UserFullDetailInfo {
  user: UserInfo;
  profile?: UserProfile;
  userGroup: UserGroup;

  constructor(user: UserInfo, userGroup: UserGroup, profile?: UserProfile) {
    this.user = user;
    this.profile = profile;
    this.userGroup = userGroup;
  }

  static fromObject(object: any): UserFullDetailInfo {
    return new UserFullDetailInfo(UserInfo.fromObject(object.user), object.userGroup ?? UserGroup.None, UserProfile.fromObject(object.profile ?? {}));
  }
}
