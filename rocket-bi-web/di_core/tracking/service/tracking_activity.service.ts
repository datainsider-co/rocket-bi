import { Inject } from 'typescript-ioc';
import { EventsResponse, UserActivitiesResponse } from '@core/domain/Response';

import { TrackingActivityRepository } from '@core/tracking/repository/tracking_activity.repository';
import { GetUserActivityByEventIdRequest, GetUserActivityRequest } from '@core/tracking/domain/request/event_tracking.request';

export abstract class TrackingActivityService {
  abstract getEvents(username: string): Promise<EventsResponse>;

  abstract getUserActivities(request: GetUserActivityRequest): Promise<UserActivitiesResponse>;

  abstract getUserActivitiesByEventId(request: GetUserActivityByEventIdRequest): Promise<UserActivitiesResponse>;
}

export class TrackingActivityServiceImpl extends TrackingActivityService {
  constructor(@Inject private activityRepository: TrackingActivityRepository) {
    super();
  }

  getEvents(username: string): Promise<EventsResponse> {
    return this.activityRepository.getEvents(username);
  }

  getUserActivities(request: GetUserActivityRequest): Promise<UserActivitiesResponse> {
    return this.activityRepository.getUserActivities(request);
  }

  getUserActivitiesByEventId(request: GetUserActivityByEventIdRequest): Promise<UserActivitiesResponse> {
    return this.activityRepository.getUserActivitiesByEventId(request);
  }
}
