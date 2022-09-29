/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:23 PM
 */

import { Gender, UserGenders } from '@core/common/domain/model';
import { TrackingProfile } from '@core/tracking/domain/TrackingProfile';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { DateTimeFormatter } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { isObject } from 'lodash';

export class UserProfile {
  username: string;
  alreadyConfirmed: boolean;
  fullName?: string;
  lastName?: string;
  firstName?: string;
  email?: string;
  mobilePhone?: string;
  gender?: number;
  dob?: number;
  avatar?: string;
  oauthType?: string;
  properties?: { [key: string]: string };
  updatedTime?: number;
  createdTime?: number;

  constructor(object: any) {
    this.username = object.username ?? '';
    this.alreadyConfirmed = object.alreadyConfirmed ?? false;
    this.fullName = object.fullName;
    this.lastName = object.lastName;
    this.firstName = object.firstName;
    this.email = object.email;
    this.mobilePhone = object.mobilePhone;
    this.gender = UserGenders.toGenderId(object.gender ?? UserGenders.Other);
    this.dob = object.dob;
    this.avatar = object.avatar;
    this.oauthType = object.oauthType;
    this.properties = object.properties;
    this.updatedTime = object.updatedTime;
    this.createdTime = object.createdTime;
  }

  static unknown() {
    return new UserProfile({
      fullName: 'Unknown'
    });
  }

  get userAvatar(): string {
    return this.avatar && StringUtils.isNotEmpty(this.avatar) ? this.avatar : this.defaultAvatar;
  }

  get defaultAvatar(): string {
    return HtmlElementRenderUtils.renderAvatarAsDataUrl(this.fullName ?? '') ?? '';
  }

  get displayDateOfBirth(): string {
    return this.dob ? DateTimeFormatter.formatAsDDMMYYYY(this.dob) : '';
  }

  displayExtraFieldName(fieldName: string): string {
    return StringUtils.camelToCapitalizedStr(fieldName);
  }

  get displayGender(): string {
    return UserGenders.toDisplayName(this.gender ?? UserGenders.Other);
  }

  static fromObject(object: any): UserProfile {
    return new UserProfile(object);
  }

  get getName(): string {
    return this.fullName || `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.email || this.username;
  }

  static toTrackingProfile(userProfile: UserProfile): TrackingProfile {
    return new TrackingProfile(
      userProfile.username ?? '',
      userProfile.fullName ?? '',
      userProfile.firstName ?? '',
      userProfile.lastName ?? '',
      userProfile.email ?? '',
      userProfile.dob ?? 0,
      userProfile.createdTime ?? 0,
      userProfile.updatedTime ?? 0,
      '',
      '',
      '',
      userProfile.mobilePhone ?? '',
      UserGenders.toDisplayName(userProfile.gender ?? UserGenders.Other),
      userProfile.avatar ?? '',
      userProfile.properties
    );
  }
}
