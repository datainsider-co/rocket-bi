/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:07 PM
 */

import { UserProfile, SharedUserInfo } from '@core/common/domain';

export class ResourceInfo {
  owner: UserProfile;
  totalUserSharing: number;
  usersSharing: SharedUserInfo[];

  constructor(owner: UserProfile, totalUserSharing: number, usersSharing: SharedUserInfo[]) {
    this.owner = owner;
    this.totalUserSharing = totalUserSharing;
    this.usersSharing = usersSharing;
  }

  static fromObject(object: any): ResourceInfo {
    return new ResourceInfo(
      object.owner ? UserProfile.fromObject(object.owner) : UserProfile.unknown(),
      object.totalUserSharing,
      object.usersSharing.map((user: any) => SharedUserInfo.fromObject(user))
    );
  }
}
