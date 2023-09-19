import { GetUserActivityRequest } from '../domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { Log } from '@core/utils';
import { DIException, PageResult } from '@core/common/domain';
import { UserActivity } from '@core/organization/domain/user-activity/UserActivity';

export abstract class ActivityRepository {
  abstract getUserActivities(request: GetUserActivityRequest): Promise<PageResult<UserActivity>>;
}

export class ActivityRepositoryImpl extends ActivityRepository {
  @InjectValue(DIKeys.BiClient)
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
