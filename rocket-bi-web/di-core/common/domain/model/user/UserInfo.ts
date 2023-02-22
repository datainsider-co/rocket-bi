/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:23 PM
 */

export class UserInfo {
  username!: string;
  roles!: number[];
  permissions?: string[];
  isActive!: boolean;
  createdTime!: number;
  organization!: Organization;

  constructor(object: any) {
    this.username = object.username ?? '';
    this.roles = object.roles ?? [];
    this.permissions = object.permissions ?? [];
    this.isActive = object.isActive;
    this.createdTime = object.createdTime;
    this.organization = object.organization;
  }

  static fromObject(object: any): UserInfo {
    return new UserInfo(object);
  }
}

export class Organization {
  organizationId: string;
  owner: string;
  isActive: boolean;
  name: string;
  reportTimeZoneId?: string;
  createdTime?: number;
  domain: string;
  thumbnailUrl?: string;
  expiredTimeMs?: number;
  licenceKey?: string;

  constructor(
    organizationId: string,
    owner: string,
    isActive: boolean,
    name: string,
    domain: string,
    createdTime?: number,
    reportTimeZoneId?: string,
    thumbnailUrl?: string,
    expiredTimeMs?: number,
    licenceKey?: string
  ) {
    this.organizationId = organizationId;
    this.owner = owner;
    this.isActive = isActive;
    this.name = name;
    this.reportTimeZoneId = reportTimeZoneId;
    this.createdTime = createdTime;
    this.domain = domain;
    this.thumbnailUrl = thumbnailUrl;
    this.expiredTimeMs = expiredTimeMs;
    this.licenceKey = licenceKey;
  }

  isExpiredCache(): boolean {
    return Date.now() > (this.expiredTimeMs || 0);
  }

  static fromObject(object: any): Organization {
    return new Organization(
      object.organizationId,
      object.owner,
      object.isActive,
      object.name,
      object.domain,
      object.createdTime,
      object.reportTimeZoneId,
      object.thumbnailUrl,
      object.expiredTimeMs ?? Date.now(),
      object.licenceKey
    );
  }

  static default() {
    return new Organization('0', 'root', true, 'DATA INSIDER', 'datainsider.com', Date.now());
  }
}
