import {
  ForceRunResponse,
  GetListPeriodicQueryRequest,
  GetListPeriodicQueryResponse,
  GetListQueryResponse,
  GetPeriodicQueryResponse,
  PeriodicQueryForceRunRequest,
  PeriodicQueryHistoryRequest,
  PeriodicQueryInfo,
  PeriodicQueryScheduleRequest,
  QueryAction,
  ScheduleQueryResponse,
  ScheduleResponse,
  SparkQueryRequest
} from '@core/LakeHouse/Domain';
import { Inject } from 'typescript-ioc';
import { ScheduleRepository } from '@core/LakeHouse/Repository';

export abstract class ScheduleService {
  abstract getPeriodicQueryInfo(queryId: string): Promise<GetPeriodicQueryResponse>;

  abstract getListQuery(request: GetListPeriodicQueryRequest): Promise<GetListPeriodicQueryResponse>;

  abstract getListQueryByUser(request: GetListPeriodicQueryRequest): Promise<GetPeriodicQueryResponse>;

  abstract getHistory(request: PeriodicQueryHistoryRequest): Promise<GetListQueryResponse>;

  abstract check(request: PeriodicQueryScheduleRequest): Promise<void>;

  abstract scheduler(request: PeriodicQueryInfo): Promise<ScheduleQueryResponse>;

  abstract start(request: SparkQueryRequest): Promise<ScheduleResponse>;

  abstract stop(request: SparkQueryRequest): Promise<ScheduleResponse>;

  abstract delete(queryId: string): Promise<GetPeriodicQueryResponse>;

  abstract forceRun(request: PeriodicQueryForceRunRequest): Promise<ForceRunResponse>;
}

export class ScheduleServiceImpl extends ScheduleService {
  @Inject
  readonly repository!: ScheduleRepository;

  getListQuery(request: GetListPeriodicQueryRequest): Promise<GetListPeriodicQueryResponse> {
    return this.repository.getListQuery(request);
  }

  check(request: PeriodicQueryScheduleRequest): Promise<void> {
    return this.repository.action(QueryAction.Check, request);
  }

  forceRun(request: PeriodicQueryForceRunRequest): Promise<ForceRunResponse> {
    return this.repository.action(QueryAction.ForceRun, request).then(res => ForceRunResponse.fromObject(res));
  }

  getHistory(request: PeriodicQueryHistoryRequest): Promise<GetListQueryResponse> {
    return this.repository.getHistory(request);
  }

  getListQueryByUser(request: GetListPeriodicQueryRequest): Promise<GetPeriodicQueryResponse> {
    return this.repository.getListQueryByUser(request);
  }

  getPeriodicQueryInfo(queryId: string): Promise<GetPeriodicQueryResponse> {
    return this.repository.getPeriodicQueryInfo(queryId);
  }

  scheduler(request: PeriodicQueryInfo): Promise<ScheduleQueryResponse> {
    return this.repository.action(QueryAction.Schedule, request).then(res => ScheduleQueryResponse.fromObject(res));
  }

  start(request: SparkQueryRequest): Promise<ScheduleResponse> {
    return this.repository.action(QueryAction.Start, request).then(res => ScheduleResponse.fromObject(res));
  }

  stop(request: SparkQueryRequest): Promise<ScheduleResponse> {
    return this.repository.action(QueryAction.Stop, request).then(res => ScheduleResponse.fromObject(res));
  }

  delete(queryId: string): Promise<GetPeriodicQueryResponse> {
    return this.repository.delete(queryId);
  }
}
