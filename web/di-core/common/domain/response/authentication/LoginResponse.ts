/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:06 PM
 */

import { SessionInfo, UserInfo, UserProfile } from '@core/common/domain';

export class LoginResponse {
  session!: SessionInfo;
  userInfo!: UserInfo;
  userProfile!: UserProfile;
  defaultOAuthCredential?: boolean;

  constructor(session: SessionInfo, userInfo: UserInfo, userProfile: UserProfile, defaultOAuthCredential?: boolean) {
    this.session = session;
    this.userInfo = userInfo;
    this.userProfile = userProfile;
    this.defaultOAuthCredential = defaultOAuthCredential;
  }

  static fromObject(object: any): LoginResponse {
    return new LoginResponse(
      SessionInfo.fromObject(object.session),
      UserInfo.fromObject(object.userInfo),
      UserProfile.fromObject(object.userProfile),
      object.defaultOAuthCredential
    );
  }
}
