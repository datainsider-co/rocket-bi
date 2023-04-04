import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Job, JobInfo } from '@core/data-ingestion/domain/job/Job';
import { Inject } from 'typescript-ioc';
import { JobService } from '@core/data-ingestion/service/JobService';
import { Log } from '@core/utils';
import { DIException, JobId } from '@core/common/domain';
import { JobStatus, ListingResponse, SortRequest } from '@core/data-ingestion';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';
import { ListingRequest } from '@core/lake-house/domain/request/listing-request/ListingRequest';
import { RefreshOption } from '@/screens/data-ingestion/interfaces/RefreshOption';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.jobStore })
class JobStore extends VuexModule {
  jobList: JobInfo[] = [];
  totalRecord = 0;
  refreshOption: RefreshOption = {
    displayName: 'Auto Refresh 5s',
    time: 5000,
    autoRefresh: true
  };
  defaultDatasourceIcon = require('@/assets/icon/data_ingestion/datasource/ic_default.svg');

  @Inject
  private readonly jobService!: JobService;

  @Action
  loadJobList(payload: { from: number; size: number; sorts?: SortRequest[]; keyword: string; currentStatus?: JobStatus[] }) {
    const { from, size, sorts, keyword, currentStatus } = payload;
    return this.jobService
      .list(new ListingRequest(keyword, from, size, sorts), currentStatus)
      .then(response => {
        this.setJobList(response);
      })
      .catch(e => {
        const exception = DIException.fromObject(e);
        Log.error('JobStore::loadJobList::exception::', exception.message);
        throw new DIException(exception.message);
      });
  }

  @Mutation
  setRefreshOption(option: RefreshOption) {
    this.refreshOption = option;
  }

  @Mutation
  setJobList(response: ListingResponse<JobInfo>) {
    this.jobList = response.data;
    this.totalRecord = response.total;
  }

  @Action
  deleteJob(jobId: JobId) {
    return this.jobService.delete(jobId);
  }
  @Action
  deleteJobs(jobIds: JobId[]) {
    return this.jobService.multiDelete(jobIds);
  }

  @Action
  create(job: Job): Promise<JobInfo> {
    return this.jobService.create(job);
  }
  @Action
  createMulti(payload: { job: Job; tables: string[] }): Promise<boolean> {
    const { job, tables } = payload;
    return this.jobService.multiCreate(job, tables);
  }

  @Action
  update(job: Job) {
    return this.jobService.update(job.jobId, job);
  }

  @Action
  testJobConnection(job: Job): Promise<boolean> {
    return this.jobService.testConnection(job);
    // return Promise.resolve(true);
  }

  @Action
  forceSync(payload: { jobId: JobId; date: number; mode: ForceMode }): Promise<boolean> {
    const { jobId, date, mode } = payload;
    return this.jobService.forceSync(jobId, date, mode);
  }
  @Action
  multiForceSync(payload: { jobIds: JobId[]; date: number; mode: ForceMode }): Promise<Record<JobId, boolean>> {
    const { jobIds, date, mode } = payload;
    return this.jobService.multiForceSync(jobIds, date, mode);
  }

  @Action
  cancel(job: Job): Promise<boolean> {
    return this.jobService.cancel(job.jobId);
  }
}

export const JobModule: JobStore = getModule(JobStore);
