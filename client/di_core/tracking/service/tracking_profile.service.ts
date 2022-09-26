import { Inject } from 'typescript-ioc';
import { TableSchema } from '@core/domain/Model';
import { TrackingProfileSearchRequest } from '@core/domain/Request';
import { AbstractTableResponse } from '@core/domain/Response/Query/AbstractTableResponse';
import { UpdateTrackingProfileRequest } from '@core/tracking/domain/request/update_tracking_profile_request';
import { TrackingProfileRepository } from '@core/tracking/repository/tracking_profile.repository';
import { TrackingProfileResponse } from '@core/tracking/domain/response/tracking_profile_response';

export abstract class TrackingProfileService {
  abstract listProperties(): Promise<TableSchema>;

  abstract search(request: TrackingProfileSearchRequest): Promise<AbstractTableResponse>;

  abstract getTrackingProfile(username: string): Promise<TrackingProfileResponse>;

  abstract updateProfile(request: UpdateTrackingProfileRequest): Promise<boolean>;
}

export class TrackingProfileServiceImpl extends TrackingProfileService {
  constructor(@Inject private profileRepository: TrackingProfileRepository) {
    super();
  }

  listProperties(): Promise<TableSchema> {
    return this.profileRepository.listProperties();
  }

  search(request: TrackingProfileSearchRequest): Promise<AbstractTableResponse> {
    return this.profileRepository.search(request);
  }

  getTrackingProfile(username: string): Promise<TrackingProfileResponse> {
    return this.profileRepository.getTrackingProfile(username);
  }

  updateProfile(request: UpdateTrackingProfileRequest): Promise<boolean> {
    return this.profileRepository.updateProfile(request);
  }
}
