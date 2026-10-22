import Deneric from 'deneric2';

// Field names checked against /user/auth/login (user_info.organization) and the backend `Organization` case class.
export class Organization extends Deneric {
  organizationId = 0;
  owner = '';
  name = '';
  domain = '';
  isActive = false;
  reportTimeZoneId = '';
  thumbnailUrl = '';
  createdTime = 0;
  updatedTime = 0;
  updatedBy = '';
  licenceKey = '';

  constructor(json?: unknown) {
    super({
      organizationId: ['organization_id', Number],
      owner: ['owner', String],
      name: ['name', String],
      domain: ['domain', String],
      isActive: ['is_active', Boolean],
      reportTimeZoneId: ['report_time_zone_id', String],
      thumbnailUrl: ['thumbnail_url', String],
      createdTime: ['created_time', Number],
      updatedTime: ['updated_time', Number],
      updatedBy: ['updated_by', String],
      licenceKey: ['licence_key', String]
    });
    this.fromJson(json);
  }
}
