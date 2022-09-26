import {
  GetListPeriodicQueryRequest,
  GetListPeriodicQueryResponse,
  GetListQueryResponse,
  GetPeriodicQueryResponse,
  PeriodicQueryHistoryRequest,
  QueryAction
} from '@core/LakeHouse/Domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services';
import { LakeHouseRequest } from '@core/LakeHouse/Domain/Request/LakeHouseRequest';

export abstract class ScheduleRepository {
  abstract getPeriodicQueryInfo(queryId: string): Promise<GetPeriodicQueryResponse>;

  abstract getListQuery(request: GetListPeriodicQueryRequest): Promise<GetListPeriodicQueryResponse>;

  abstract action(action: QueryAction, request: any): Promise<any>;

  abstract delete(queryId: string): Promise<GetPeriodicQueryResponse>;

  abstract getListQueryByUser(request: GetListPeriodicQueryRequest): Promise<GetPeriodicQueryResponse>;

  abstract getHistory(request: PeriodicQueryHistoryRequest): Promise<GetListQueryResponse>;
}

export class ScheduleRepositoryImpl extends ScheduleRepository {
  @InjectValue(DIKeys.SchedulerClient)
  private readonly client!: BaseClient;

  getPeriodicQueryInfo(queryId: string): Promise<GetPeriodicQueryResponse> {
    return this.client.get('/schedule', { queryId: queryId }).then(result => GetPeriodicQueryResponse.fromObject(result));
  }

  getListQuery(request: GetListPeriodicQueryRequest): Promise<GetListPeriodicQueryResponse> {
    return this.client.get('/schedule/list', request).then(result => GetListPeriodicQueryResponse.fromObject(result));
  }

  action(action: QueryAction, request: any): Promise<any> {
    return this.client.post(
      '/schedule/action',
      JSON.stringify(request),
      {
        cmd: action
      },
      {
        'Content-Type': 'application/x-www-form-urlencoded;'
      }
    );
  }

  getListQueryByUser(request: GetListPeriodicQueryRequest): Promise<GetPeriodicQueryResponse> {
    return this.client.get('/schedule/listbyuser', request).then(result => GetPeriodicQueryResponse.fromObject(result));
  }

  getHistory(request: PeriodicQueryHistoryRequest): Promise<GetListQueryResponse> {
    return this.client.get('/schedule/history', request).then(result => GetListQueryResponse.fromObject(result));
  }

  delete(queryId: string): Promise<GetPeriodicQueryResponse> {
    return this.client.delete('/schedule', { queryId: queryId }).then(result => GetPeriodicQueryResponse.fromObject(result));
  }
}
