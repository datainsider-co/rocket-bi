/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:07 PM
 */

import { UserProfile } from '@core/common/domain/model';

export class SharedUserInfo {
  id: string;
  user: UserProfile;
  permissions: string[];
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;

  constructor(id: string, user: UserProfile, permissions: string[], createdAt: number, updatedAt: number, createdBy: string, updatedBy: string) {
    this.id = id;
    this.user = user;
    this.permissions = permissions;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  static fromObject(obj: any): SharedUserInfo {
    return new SharedUserInfo(obj.id, UserProfile.fromObject(obj.user), obj.permissions, obj.createdAt, obj.updatedAt, obj.createdBy, obj.updatedBy);
  }
}
