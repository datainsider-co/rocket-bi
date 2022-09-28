import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services';
import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';
import { JobId } from '@core/domain';
import { ListingResponse } from '@core/DataIngestion';
import { BaseResponse } from '@core/DataIngestion/Domain/Response/BaseResponse';
import { LakeJobResponse } from '@core/LakeHouse/Domain/LakeJob/LakeJobResponse';
import { LakeJobHistory } from '@core/LakeHouse/Domain/LakeJob/LakeJobHistory';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';
import { ForceMode } from '@core/LakeHouse/Domain/LakeJob/ForceMode';

export abstract class LakeJobRepository {
  abstract create(job: LakeJob): Promise<LakeJob>;
  abstract get(jobId: JobId): Promise<LakeJobResponse>;
  abstract list(request: ListingRequest): Promise<ListingResponse<LakeJobResponse>>;
  abstract listHistory(request: ListingRequest): Promise<ListingResponse<LakeJobHistory>>;
  abstract delete(jobId: JobId): Promise<boolean>;
  abstract update(job: LakeJob): Promise<boolean>;
  abstract forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<boolean>;
  abstract cancel(jobId: JobId): Promise<boolean>;
}
export class LakeJobRepositoryImpl extends LakeJobRepository {
  @InjectValue(DIKeys.SchedulerClient)
  private readonly httpClient!: BaseClient;

  create(job: LakeJob): Promise<LakeJob> {
    return this.httpClient
      .post<LakeJob>(`/scheduler/lake/job/create`, { job: job })
      .then(response => response);
  }

  delete(jobId: JobId): Promise<boolean> {
    return this.httpClient.delete<BaseResponse>(`/scheduler/lake/job/${jobId}`).then(response => response.success);
  }

  get(jobId: JobId): Promise<LakeJobResponse> {
    return this.httpClient.get(`/scheduler/lake/job/${jobId}`).then(response => LakeJobResponse.fromObject(response));
  }

  list(request: ListingRequest): Promise<ListingResponse<LakeJobResponse>> {
    return this.httpClient.post<ListingResponse<LakeJobResponse>>(`/scheduler/lake/job/list`, request).then(async response => {
      const lakeJobResponses = response.data.map(lakeJobResponse => {
        return LakeJobResponse.fromObject(lakeJobResponse);
      });
      return new ListingResponse<LakeJobResponse>(lakeJobResponses, response.total);
    });
  }

  listHistory(request: ListingRequest): Promise<ListingResponse<LakeJobHistory>> {
    return this.httpClient.post<ListingResponse<LakeJobHistory>>(`/scheduler/lake/history/list`, request).then(response => {
      const jobHistories = response.data.map(jobHistory => LakeJobHistory.fromObject(jobHistory));
      return new ListingResponse<LakeJobHistory>(jobHistories, response.total);
    });
  }

  update(job: LakeJob): Promise<boolean> {
    return this.httpClient
      .put<BaseResponse>(`/scheduler/lake/job/${job.jobId}`, { job: job })
      .then(response => response.success);
  }

  forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<boolean> {
    return this.httpClient
      .put<BaseResponse>(`scheduler/lake/schedule/job/${jobId}/now`, { atTime: date, mode: mode })
      .then(response => response.success);
  }

  cancel(jobId: JobId): Promise<boolean> {
    return this.httpClient.put<BaseResponse>(`scheduler/lake/schedule/job/${jobId}/kill`).then(response => response.success);
  }
}

export class LakeJobRepositoryMock extends LakeJobRepository {
  cancel(jobId: JobId): Promise<boolean> {
    return Promise.resolve(false);
  }

  create(job: LakeJob): Promise<LakeJob> {
    return Promise.resolve(
      LakeJob.fromObject({
        className: 'sql_job',
        creatorId: 'root',
        currentJobStatus: 'Finished',
        jobId: 16,
        jobType: 'SQL',
        lastRunStatus: 'Finished',
        lastRunTime: 1643348779001,
        name: 'From_lake',
        nextRunTime: 21643348660998,
        orgId: 0,
        outputs: [],
        query: 'select * from feature_cashback',
        scheduleTime: { className: 'schedule_once', startTime: 1643348661000 }
      })
    );
  }

  delete(jobId: JobId): Promise<boolean> {
    return Promise.resolve(false);
  }

  forceRun(jobId: JobId): Promise<boolean> {
    return Promise.resolve(false);
  }

  get(jobId: JobId): Promise<LakeJobResponse> {
    return Promise.resolve(
      LakeJobResponse.fromObject({
        creator: {
          avatar: '',
          firstName: 'admin',
          fullName: 'root',
          gender: -1,
          lastName: 'data insider',
          username: 'root'
        },
        job: {
          className: 'sql_job',
          creatorId: 'root',
          currentJobStatus: 'Finished',
          jobId: 16,
          jobType: 'SQL',
          lastRunStatus: 'Finished',
          lastRunTime: 1643348779001,
          name: 'From_lake',
          nextRunTime: 21643348660998,
          orgId: 0,
          outputs: [],
          query: 'select * from feature_cashback',
          scheduleTime: { className: 'schedule_once', startTime: 1643348661000 }
        }
      })
    );
  }

  list(request: ListingRequest): Promise<ListingResponse<LakeJobResponse>> {
    const data: LakeJobResponse[] = [
      LakeJobResponse.fromObject({
        creator: {
          avatar: '',
          firstName: 'admin',
          fullName: 'root',
          gender: -1,
          lastName: 'data insider',
          username: 'root'
        },
        job: {
          className: 'sql_job',
          creatorId: 'root',
          currentJobStatus: 'Finished',
          jobId: 16,
          jobType: 'SQL',
          lastRunStatus: 'Finished',
          lastRunTime: 1643348779001,
          name: 'From_lake',
          nextRunTime: 21643348660998,
          orgId: 0,
          outputs: [],
          query: 'select * from feature_cashback',
          scheduleTime: { className: 'schedule_once', startTime: 1643348661000 }
        }
      }),
      LakeJobResponse.fromObject({
        creator: {
          avatar: '',
          firstName: 'admin',
          fullName: 'root',
          gender: -1,
          lastName: 'data insider',
          username: 'root'
        },
        job: {
          className: 'xxvcvv',
          creatorId: 'root',
          currentJobStatus: 'Finished',
          jobId: 16,
          jobType: 'SQL',
          lastRunStatus: 'Finished',
          lastRunTime: 1643348779001,
          name: 'dfdfdfd',
          nextRunTime: 21643348660998,
          orgId: 0,
          outputs: [],
          query: 'select * from feature_cashback',
          scheduleTime: { className: 'schedule_once', startTime: 1643348661000 }
        }
      })
    ];
    const total = 0;
    return Promise.resolve({ data: data, total: total });
  }

  listHistory(request: ListingRequest): Promise<ListingResponse<LakeJobHistory>> {
    return Promise.resolve({ data: [], total: 0 });
  }

  update(job: LakeJob): Promise<boolean> {
    return Promise.resolve(false);
  }
}
