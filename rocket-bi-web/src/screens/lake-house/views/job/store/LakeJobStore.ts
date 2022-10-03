import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import { DIException, JobId } from '@core/common/domain';
import { QueryService, ScheduleService } from '@core/lake-house/service';
import { GetListQueryRequest } from '@core/lake-house/domain';
import { StringUtils } from '@/utils/StringUtils';
import { LakeJob } from '@core/lake-house/domain/lake-job/LakeJob';
import { LakeJobService } from '@core/lake-house/service/LakeJobService';
import { ListingResponse, SortRequest } from '@core/data-ingestion';
import { LakeJobResponse } from '@core/lake-house/domain/lake-job/LakeJobResponse';
import { SQLJob } from '@core/lake-house/domain/lake-job/SQLJob';
import { LakeJobHistory } from '@core/lake-house/domain/lake-job/LakeJobHistory';
import { ListingRequest } from '@core/lake-house/domain/request/listing-request/ListingRequest';
import { reject } from 'lodash';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.LakeJob })
class LakeJobStore extends VuexModule {
  //using for jobs
  jobs: LakeJobResponse[] = [];
  totalJobs = 0;
  //using for job history
  jobHistories: LakeJobHistory[] = [];
  totalHistories = 0;

  // @Inject
  // private readonly jobService!: JobService;

  @Inject
  private readonly lakeJobService!: LakeJobService;

  @Inject
  private readonly queryService!: QueryService;

  @Inject
  private readonly schedulerService!: ScheduleService;

  @Action
  async loadHistories(payload: { from: number; size: number; sorts: SortRequest[]; keyword: string }) {
    try {
      const { from, size, sorts, keyword } = payload;
      const request = new ListingRequest();
      request.from = from;
      request.size = size;
      request.sorts = sorts;
      request.keyword = keyword;
      const response = await this.lakeJobService.listHistory(request);
      this.setQueryHistoryResponse(response);
    } catch (e) {
      const exception = DIException.fromObject(e);
      Log.error('JobStore::loadJobList::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  @Action
  async loadJobs(payload: { from: number; size: number; keyword: string; sorts: SortRequest[] }) {
    try {
      const { from, size, sorts, keyword } = payload;
      const request = new ListingRequest();
      request.from = from;
      request.size = size;
      request.sorts = sorts;
      request.keyword = keyword;
      const response = await this.lakeJobService.list(request);
      this.setJobResponse(response);
    } catch (e) {
      const exception = DIException.fromObject(e);
      Log.error('JobStore::loadJobQuery::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  @Mutation
  setQueryHistoryResponse(response: ListingResponse<LakeJobHistory>) {
    const { data, total } = response;
    this.jobHistories = data;
    this.totalHistories = total;
  }

  @Mutation
  setJobResponse(response: ListingResponse<LakeJobResponse>) {
    const { data, total } = response;
    this.jobs = data;
    this.totalJobs = total;
  }

  // @Action
  // async enableJob(query: PeriodicQueryInfo): Promise<ScheduleResponse> {
  //   const { id } = query;
  //   const request = new SparkQueryRequest(id);
  //   const res = await this.schedulerService.start(request);
  //   this.updateStatus({ id: id, newStatus: PeriodicQueryStatus.ENABLED });
  //   return res;
  // }

  // @Action
  // async stopJob(query: PeriodicQueryInfo): Promise<ScheduleResponse> {
  //   const { id } = query;
  //   const request = new SparkQueryRequest(id);
  //   const res = await this.schedulerService.stop(request);
  //   this.updateStatus({ id: id, newStatus: PeriodicQueryStatus.DISABLED });
  //   return res;
  // }
  //
  // @Mutation
  // updateStatus(payload: { id: string; newStatus: PeriodicQueryStatus }) {
  //   const { id, newStatus } = payload;
  //   const index = this.jobs.findIndex(query => query.id === id);
  //   this.jobs[index].status = newStatus;
  // }

  @Action
  async executeJob(job: SQLJob) {
    // const { query, priority, notifyInfo, outputs } = job;
    // const request = new ExecuteRequest(query, priority, notifyInfo, outputs);
    // return this.queryService.action(QueryAction.Execute, request);
  }

  // @Action
  // async cancelJob(job: QueryInfo) {
  //   const { id } = job;
  //   const request = new SparkQueryRequest(id);
  //   return this.queryService.action(QueryAction.Cancel, request);
  // }
  @Action
  async deleteJob(job: LakeJob) {
    const { jobId } = job;
    return this.lakeJobService.delete(jobId);
  }
  @Action
  async forceRun(payload: { jobId: JobId; date: number; mode: ForceMode }) {
    const { jobId, date, mode } = payload;
    Log.debug('forceSyncJob::jobId::', jobId, date, mode);
    return this.lakeJobService.forceRun(jobId, date, mode);
  }

  @Action cancelJob(job: LakeJob) {
    return this.lakeJobService.cancel(job.jobId);
  }
}

export const LakeJobModule: LakeJobStore = getModule(LakeJobStore);
