import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import { BaseClient } from '@core/common/services/HttpClient';
import { EventsResponse, UserActivitiesResponse } from '@core/common/domain/response';
import { GetUserActivityByEventIdRequest, GetUserActivityRequest } from '@core/tracking/domain/request/EventTrackingRequest';

export abstract class TrackingActivityRepository {
  abstract getEvents(username: string): Promise<EventsResponse>;

  abstract getUserActivities(request: GetUserActivityRequest): Promise<UserActivitiesResponse>;

  abstract getUserActivitiesByEventId(request: GetUserActivityByEventIdRequest): Promise<UserActivitiesResponse>;
}

export class TrackingActivityRepositoryImpl extends TrackingActivityRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;
  private apiPath = '/analytics';

  getEvents(username: string): Promise<EventsResponse> {
    return this.httpClient.get<EventsResponse>(`${this.apiPath}/activities/${username}/events`).then(response => EventsResponse.fromObject(response));
  }

  getUserActivities(request: GetUserActivityRequest): Promise<UserActivitiesResponse> {
    return this.httpClient
      .post<UserActivitiesResponse>(
        `${this.apiPath}/activities/${request.username}?from_time=${request.fromTime}&to_time=${request.toTime}&from=${request.from}&size=${request.size}`,
        // eslint-disable-next-line @typescript-eslint/camelcase
        { include_events: request.includeEvents }
      )
      .then(response => UserActivitiesResponse.fromObject(response));
  }

  getUserActivitiesByEventId(request: GetUserActivityByEventIdRequest): Promise<UserActivitiesResponse> {
    return this.httpClient
      .get<UserActivitiesResponse>(`${this.apiPath}/events/${request.eventId}/activities?from=${request.from}&size=${request.size}`)
      .then(response => UserActivitiesResponse.fromObject(response));
  }
}
