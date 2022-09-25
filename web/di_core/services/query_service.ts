/*
 * @author: tvc12 - Thien Vi
 * @created: 11/27/20, 10:26 AM
 */

import { Inject } from 'typescript-ioc';
import { QueryRepository } from '@core/repositories';
import { VisualizationResponse } from '@core/domain/Response';
import { QueryRequest } from '@core/domain/Request';
import { cloneDeep } from 'lodash';
import { DIException, UserProfile } from '@core/domain';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Log } from '@core/utils';

export abstract class QueryService {
  abstract query(request: QueryRequest): Promise<VisualizationResponse>;
  abstract viewAsQuery(request: QueryRequest, userProfile: UserProfile): Promise<VisualizationResponse>;
}

export class QueryServiceImpl implements QueryService {
  constructor(@Inject private repository: QueryRepository) {}

  query(request: QueryRequest): Promise<VisualizationResponse> {
    const newRequest = this.removeUnusedData(request);
    return this.repository
      .query(newRequest)
      .then(data => {
        TrackingUtils.track(TrackEvents.QueryChartOk, { query: JSON.stringify(request) });
        return data;
      })
      .catch(ex => {
        TrackingUtils.track(TrackEvents.QueryChartFail, { query: JSON.stringify(request), error: ex.message });
        throw DIException.fromObject(ex);
      });
  }

  viewAsQuery(request: QueryRequest, userProfile: UserProfile): Promise<VisualizationResponse> {
    const newRequest = this.removeUnusedData(request);
    return this.repository
      .queryWithUser(newRequest, userProfile)
      .then(data => {
        TrackingUtils.track(TrackEvents.QueryChartOk, { query: JSON.stringify(request) });
        return data;
      })
      .catch(ex => {
        TrackingUtils.track(TrackEvents.QueryChartFail, { query: JSON.stringify(request), error: ex.message });
        throw DIException.fromObject(ex);
      });
  }

  private removeUnusedData(request: QueryRequest): QueryRequest {
    const newRequest = cloneDeep(request);
    newRequest.querySetting.options = {};
    return newRequest;
  }
}
