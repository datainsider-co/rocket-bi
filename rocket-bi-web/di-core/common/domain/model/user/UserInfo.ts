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
    return new UserInfo({
      username: object.username,
      roles: object.roles,
      permissions: object.permissions,
      isActive: object.isActive,
      createdTime: object.createdTime,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      organization: object.organization ? Organization.fromObject(object.organization) : Organization.default()
    });
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
  licenceKey: string;

  constructor(
    organizationId: string,
    owner: string,
    isActive: boolean,
    name: string,
    domain: string,
    licenceKey: string,
    createdTime?: number,
    reportTimeZoneId?: string,
    thumbnailUrl?: string,
    expiredTimeMs?: number
  ) {
    this.organizationId = organizationId;
    this.owner = owner;
    this.isActive = isActive;
    this.name = name;
    this.reportTimeZoneId = reportTimeZoneId;
    this.createdTime = createdTime;
    this.domain = domain;
    this.licenceKey = licenceKey;
    this.thumbnailUrl = thumbnailUrl;
    this.expiredTimeMs = expiredTimeMs;
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
      object.licenceKey,
      object.createdTime,
      object.reportTimeZoneId,
      object.thumbnailUrl,
      object.expiredTimeMs ?? Date.now()
    );
  }

  static default() {
    return new Organization('0', 'root', true, 'DATA INSIDER', 'datainsider.com', '', Date.now());
  }
}
