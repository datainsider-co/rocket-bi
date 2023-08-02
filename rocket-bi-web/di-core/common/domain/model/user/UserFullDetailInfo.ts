import { UserInfo } from '@core/common/domain/model/user/UserInfo';
import { UserProfile } from '@core/common/domain/model/user/UserProfile';

export class UserFullDetailInfo {
  user: UserInfo;
  profile?: UserProfile;

  constructor(user: UserInfo, profile?: UserProfile) {
    this.user = user;
    this.profile = profile;
  }

  static fromObject(object: any): UserFullDetailInfo {
    return new UserFullDetailInfo(UserInfo.fromObject(object.user), UserProfile.fromObject(object.profile ?? {}));
  }
}
