import { GetUserActivityRequest, UserActivityGroup, UserActivity } from '../Domain/';
import { Inject } from 'typescript-ioc';
import { ActivityRepository } from '../Repository';
import { PageResult } from '@core/domain';

export abstract class ActivityService {
  abstract getUserActivities(request: GetUserActivityRequest): Promise<PageResult<UserActivity>>;
}

export class ActivityServiceImpl extends ActivityService {
  constructor(@Inject private activityRepository: ActivityRepository) {
    super();
  }

  getUserActivities(request: GetUserActivityRequest): Promise<PageResult<UserActivity>> {
    return this.activityRepository.getUserActivities(request);
  }
}
