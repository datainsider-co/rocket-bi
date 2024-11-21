import { TrackingProfile } from '@core/tracking/domain/TrackingProfile';

export class UpdateTrackingProfileRequest {
  userId: string;
  properties: TrackingProfile;

  constructor(userId: string, properties: TrackingProfile) {
    this.userId = userId || '';
    this.properties = properties || {};
  }

  static fromObject(obj: UpdateTrackingProfileRequest): UpdateTrackingProfileRequest {
    return new UpdateTrackingProfileRequest(obj.userId, obj.properties);
  }
}
