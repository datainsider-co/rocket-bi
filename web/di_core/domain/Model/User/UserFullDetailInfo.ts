import { UserInfo } from '@core/domain/Model/User/UserInfo';
import { UserProfile } from '@core/domain/Model/User/UserProfile';

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
