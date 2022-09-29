import { GetUserActivityRequest, UserActivityGroup, UserActivity } from '../domain/';
import { Inject } from 'typescript-ioc';
import { ActivityRepository } from '../repository';
import { PageResult } from '@core/common/domain';

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
