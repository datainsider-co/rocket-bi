import Deneric from 'deneric2';
import { UserInfo } from '@/core/user/UserInfo';
import { UserProfile } from '@/core/user/UserProfile';
import { SessionInfo } from './SessionInfo';

/** Returned by login and check_session. `user_profile` is optional on the server; it parses to an empty profile. */
export class LoginResponse extends Deneric {
  session = new SessionInfo();
  userInfo = new UserInfo();
  userProfile = new UserProfile();

  constructor(json?: unknown) {
    super({
      session: ['session', SessionInfo],
      userInfo: ['user_info', UserInfo],
      userProfile: ['user_profile', UserProfile]
    });
    this.fromJson(json);
  }
}
