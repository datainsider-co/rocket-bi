import { GetUserActivityRequest, PlanInfo } from '../Domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { Log } from '@core/utils';
import { DIException, PageResult } from '@core/domain';
import { ActionType, ResourceType } from '@/utils/permission_utils';
import { UserActivity } from '@core/Organization/Domain/UserActivity/UserActivity';

export abstract class ActivityRepository {
  abstract getUserActivities(request: GetUserActivityRequest): Promise<PageResult<UserActivity>>;
}

export class ActivityRepositoryImpl extends ActivityRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;

  getUserActivities(request: GetUserActivityRequest): Promise<PageResult<UserActivity>> {
    return this.httpClient
      .post<PageResult<UserActivity>>(`/query/activities`, request)
      .then(
        (res: PageResult<UserActivity>) =>
          new PageResult<UserActivity>(
            res.data.map(act => UserActivity.fromObject(act)),
            res.total
          )
      )
      .catch(e => {
        Log.error('ActivityRepository::getUserActivities::exception::', e.message);
        throw new DIException(e.message);
      });
  }
}
