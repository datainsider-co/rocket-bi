import { UserInfo, UserProfile } from '@core/domain/Model';

export class RegisterResponse {
  constructor(public userInfo: UserInfo, public userProfile: UserProfile) {}

  static fromObject(obj: any): RegisterResponse {
    return new RegisterResponse(UserInfo.fromObject(UserInfo.fromObject(obj.userInfo)), UserProfile.fromObject(obj.userProfile));
  }
}
