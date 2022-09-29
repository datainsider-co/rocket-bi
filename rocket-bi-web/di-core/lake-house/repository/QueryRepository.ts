/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 12:01 PM
 */

import { GetListQueryResponse, GetQueryResponse, GetQueryStateResponse, QueryResultResponse } from '../domain/response/query-response';
import { GetListQueryRequest } from '../domain/request/query/GetListQueryRequest';
import { QueryRequest } from '../domain/request/query/QueryRequest';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services';
import { QueryAction } from '@core/lake-house/domain/request/query/QueryAction';
import { DIException } from '@core/common/domain';

export abstract class QueryRepository {
  abstract getQueryInfo(queryId: string): Promise<GetQueryResponse>;

  abstract getQueryResult(queryId: string, from?: number, size?: number): Promise<QueryResultResponse>;

  abstract getListQuery(request: GetListQueryRequest): Promise<GetListQueryResponse>;

  abstract getQueryState(queryId: string): Promise<GetQueryStateResponse>;

  abstract action(action: QueryAction, request: QueryRequest): Promise<any>;

  abstract getListQueryByUser(request: GetListQueryRequest): Promise<GetListQueryResponse>;
}

export class QueryRepositoryImpl extends QueryRepository {
  @InjectValue(DIKeys.LakeClient)
  private readonly client!: BaseClient;

  action(action: QueryAction, request: QueryRequest): Promise<any> {
    return this.client.post(
      '/query/action',
      JSON.stringify(request),
      {
        cmd: action
      },
      {
        'Content-Type': 'application/x-www-form-urlencoded;'
      }
    );
  }

  getListQuery(request: GetListQueryRequest): Promise<GetListQueryResponse> {
    return this.client.get('/query/list', request).then(result => GetListQueryResponse.fromObject(result));
  }

  getListQueryByUser(request: GetListQueryRequest): Promise<GetListQueryResponse> {
    return this.client.get('/query/listbyuser', request).then(result => GetListQueryResponse.fromObject(result));
  }

  getQueryInfo(queryId: string): Promise<GetQueryResponse> {
    return this.client.get('/query', { queryId: queryId }).then(result => GetQueryResponse.fromObject(result));
  }

  getQueryResult(queryId: string, from?: number, size?: number): Promise<QueryResultResponse> {
    return this.client
      .get('/query/result', {
        queryId: queryId,
        from: from,
        size: size
      })
      .then(result => QueryResultResponse.fromObject(result));
  }

  getQueryState(queryId: string): Promise<GetQueryStateResponse> {
    return (
      this.client
        .get('/query/state', {
          queryId: queryId
        })
        .then(result => GetQueryStateResponse.fromObject(result))
        // !! bởi vì code của response mang nghĩa là query state, không phải là state code
        // exception throw từ client, nên cần phải map lại exception thành response
        .catch(ex => {
          const exception = DIException.fromObject(ex);
          return new GetQueryStateResponse(exception.statusCode, exception.message);
        })
    );
  }
}
