/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:06 PM
 */

import { SessionInfo, UserInfo, UserProfile } from '@core/domain';

export class LoginResponse {
  session!: SessionInfo;
  userInfo!: UserInfo;
  userProfile!: UserProfile;
  defaultOAuthCredential?: boolean;
}
