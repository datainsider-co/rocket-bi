/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:06 PM
 */

import { QueryRequest } from '../Domain/Request/Query/QueryRequest';
import { QueryAction } from '../Domain/Request/Query/QueryAction';
import { Inject } from 'typescript-ioc';
import { GetListQueryResponse, GetQueryResponse, GetQueryStateResponse, QueryResultResponse } from '../Domain/Response/QueryResponse';
import { GetListQueryRequest } from '../Domain/Request/Query/GetListQueryRequest';
import { QueryRepository } from '../Repository/QueryRepository';

export abstract class QueryService {
  abstract getQueryInfo(queryId: string): Promise<GetQueryResponse>;

  abstract getQueryResult(queryId: string, from?: number, size?: number): Promise<QueryResultResponse>;

  abstract getListQuery(request: GetListQueryRequest): Promise<GetListQueryResponse>;

  abstract getQueryState(queryId: string): Promise<GetQueryStateResponse>;

  abstract action(action: QueryAction, request: QueryRequest): Promise<any>;

  abstract getListQueryByUser(request: GetListQueryRequest): Promise<GetListQueryResponse>;
}

export class QueryServiceImpl extends QueryService {
  @Inject
  readonly repository!: QueryRepository;

  action(action: QueryAction, request: QueryRequest): Promise<any> {
    return this.repository.action(action, request);
  }

  getListQuery(request: GetListQueryRequest): Promise<GetListQueryResponse> {
    return this.repository.getListQuery(request);
  }

  getListQueryByUser(request: GetListQueryRequest): Promise<GetListQueryResponse> {
    return this.repository.getListQueryByUser(request);
  }

  getQueryInfo(queryId: string): Promise<GetQueryResponse> {
    return this.repository.getQueryInfo(queryId);
  }

  getQueryResult(queryId: string, from?: number, size?: number): Promise<QueryResultResponse> {
    return this.repository.getQueryResult(queryId, from, size);
  }

  getQueryState(queryId: string): Promise<GetQueryStateResponse> {
    return this.repository.getQueryState(queryId);
  }
}
