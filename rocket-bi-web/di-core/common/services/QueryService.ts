/*
 * @author: tvc12 - Thien Vi
 * @created: 11/27/20, 10:26 AM
 */

import { Inject } from 'typescript-ioc';
import { QueryRepository } from '@core/common/repositories';
import { VisualizationResponse } from '@core/common/domain/response';
import { QueryRequest } from '@core/common/domain/request';
import { cloneDeep } from 'lodash';
import { DIException, UserProfile } from '@core/common/domain';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export abstract class QueryService {
  abstract query(request: QueryRequest): Promise<VisualizationResponse>;
  abstract queryAsCsv(request: QueryRequest): Promise<string>;
  abstract viewAsQuery(request: QueryRequest, userProfile: UserProfile): Promise<VisualizationResponse>;
}

export class QueryServiceImpl implements QueryService {
  constructor(@Inject private repository: QueryRepository) {}

  query(request: QueryRequest): Promise<VisualizationResponse> {
    const startTime = Date.now();
    const newRequest = this.removeUnusedData(request);
    return this.repository
      .query(newRequest)
      .then(data => {
        TrackingUtils.track(TrackEvents.QueryChartOk, { query: JSON.stringify(request), di_start_time: startTime, di_duration: Date.now() - startTime });
        return data;
      })
      .catch(ex => {
        TrackingUtils.track(TrackEvents.QueryChartFail, {
          query: JSON.stringify(request),
          di_start_time: startTime,
          di_duration: Date.now() - startTime,
          error: ex.message
        });
        throw DIException.fromObject(ex);
      });
  }

  viewAsQuery(request: QueryRequest, userProfile: UserProfile): Promise<VisualizationResponse> {
    const startTime = Date.now();
    const newRequest = this.removeUnusedData(request);
    return this.repository
      .queryWithUser(newRequest, userProfile)
      .then(data => {
        TrackingUtils.track(TrackEvents.QueryChartOk, { query: JSON.stringify(request), di_start_time: startTime, di_duration: Date.now() - startTime });
        return data;
      })
      .catch(ex => {
        TrackingUtils.track(TrackEvents.QueryChartFail, {
          query: JSON.stringify(request),
          di_start_time: startTime,
          di_duration: Date.now() - startTime,
          error: ex.message
        });
        throw DIException.fromObject(ex);
      });
  }

  private removeUnusedData(request: QueryRequest): QueryRequest {
    const newRequest = cloneDeep(request);
    newRequest.querySetting.options = {};
    return newRequest;
  }

  queryAsCsv(request: QueryRequest): Promise<string> {
    const startTime = Date.now();
    const newRequest = this.removeUnusedData(request);
    return this.repository
      .queryAsCsv(newRequest)
      .then(data => {
        TrackingUtils.track(TrackEvents.QueryCsvOk, { query: JSON.stringify(request), di_start_time: startTime, di_duration: Date.now() - startTime });
        return data;
      })
      .catch(ex => {
        TrackingUtils.track(TrackEvents.QueryCsvFail, {
          query: JSON.stringify(request),
          di_start_time: startTime,
          di_duration: Date.now() - startTime,
          error: ex.message
        });
        throw DIException.fromObject(ex);
      });
  }
}
