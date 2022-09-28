import { InjectValue } from 'typescript-ioc';

import { DIKeys } from '@core/modules/di';
import { BaseClient } from '@core/services/base.service';
import { TrackingProfileSearchRequest } from '@core/domain/Request';
import { TableSchema } from '@core/domain/Model';
import { AbstractTableResponse } from '@core/domain/Response/Query/AbstractTableResponse';
import { VisualizationResponse } from '@core/domain/Response';
import { UpdateTrackingProfileRequest } from '@core/tracking/domain/request/update_tracking_profile_request';
import { TrackingProfileResponse } from '@core/tracking/domain/response/tracking_profile_response';

export abstract class TrackingProfileRepository {
  abstract listProperties(): Promise<TableSchema>;

  abstract search(request: TrackingProfileSearchRequest): Promise<AbstractTableResponse>;

  abstract getTrackingProfile(username: string): Promise<TrackingProfileResponse>;

  abstract updateProfile(request: UpdateTrackingProfileRequest): Promise<boolean>;
}

export class TrackingProfileRepositoryImpl extends TrackingProfileRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;
  private apiPath = '/analytics/profiles';

  listProperties(): Promise<TableSchema> {
    return this.httpClient.get<TableSchema>(`${this.apiPath}/properties/list`).then(response => TableSchema.fromObject(response));
  }

  search(request: TrackingProfileSearchRequest): Promise<AbstractTableResponse> {
    return this.httpClient
      .post<AbstractTableResponse>(`${this.apiPath}/search/v3`, request)
      .then(response => VisualizationResponse.fromObject(response) as AbstractTableResponse);
  }

  getTrackingProfile(username: string): Promise<TrackingProfileResponse> {
    return this.httpClient.get<TrackingProfileResponse>(`${this.apiPath}/${username}`).then(response => TrackingProfileResponse.fromObject(response));
  }

  updateProfile(request: UpdateTrackingProfileRequest): Promise<boolean> {
    return this.httpClient
      .put<boolean>(`/tracking/profiles/${request.userId}`, { properties: request.properties })
      .then(() => true);
  }
}
