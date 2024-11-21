import { Inject } from 'typescript-ioc';
import { TableSchema } from '@core/common/domain/model';
import { TrackingProfileSearchRequest } from '@core/common/domain/request';
import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import { UpdateTrackingProfileRequest } from '@core/tracking/domain/request/UpdateTrackingProfileRequest';
import { TrackingProfileRepository } from '@core/tracking/repository/TrackingProfileRepository';
import { TrackingProfileResponse } from '@core/tracking/domain/response/TrackingProfileResponse';

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
