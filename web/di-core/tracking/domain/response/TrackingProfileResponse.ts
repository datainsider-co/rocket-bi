import { TrackingProfile } from '@core/tracking/domain/TrackingProfile';

export class TrackingProfileResponse {
  columns: any;
  profile: TrackingProfile;

  constructor(columns: any, profile: TrackingProfile) {
    this.columns = columns || [];
    this.profile = profile || {};
  }

  static fromObject(obj: TrackingProfileResponse): TrackingProfileResponse {
    return new TrackingProfileResponse(obj.columns, obj.profile);
  }
}
