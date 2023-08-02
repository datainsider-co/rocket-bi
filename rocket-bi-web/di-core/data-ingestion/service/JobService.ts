/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:03 PM
 */

import { Job, JobInfo } from '@core/data-ingestion/domain/job/Job';
import { JobRepository } from '@core/data-ingestion/repository/JobRepository';
import { Inject } from 'typescript-ioc';
import { JobId, ListingRequest } from '@core/common/domain';
import { JobStatus, ListingResponse } from '@core/data-ingestion';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';

export abstract class JobService {
  abstract create(request: Job): Promise<JobInfo>;

  abstract multiCreate(request: Job, tables: string[]): Promise<boolean>;

  abstract list(request: ListingRequest, currentStatuses?: JobStatus[]): Promise<ListingResponse<JobInfo>>;

  abstract delete(id: JobId): Promise<boolean>;

  abstract multiDelete(ids: JobId[]): Promise<boolean>;

  abstract update(id: JobId, job: Job): Promise<boolean>;

  abstract testConnection(job: Job): Promise<boolean>;

  abstract forceSync(jobId: JobId, date: number, mode: ForceMode): Promise<boolean>;

  abstract multiForceSync(jobIds: JobId[], date: number, mode: ForceMode): Promise<Record<JobId, boolean>>;

  abstract cancel(jobId: JobId): Promise<boolean>;

  abstract multiCreateV2(jobs: Job[]): Promise<boolean>;
}

export class JobServiceImpl implements JobService {
  constructor(@Inject private jobRepository: JobRepository) {}

  create(request: Job): Promise<JobInfo> {
    return this.jobRepository.create(request);
  }

  delete(id: JobId): Promise<boolean> {
    return this.jobRepository.delete(id);
  }
  multiDelete(ids: JobId[]): Promise<boolean> {
    return this.jobRepository.multiDelete(ids);
  }

  list(request: ListingRequest, currentStatuses?: JobStatus[]): Promise<ListingResponse<JobInfo>> {
    return this.jobRepository.list(request, currentStatuses);
  }

  update(id: JobId, job: Job): Promise<boolean> {
    return this.jobRepository.update(id, job);
  }

  testConnection(job: Job): Promise<boolean> {
    return this.jobRepository.testConnection(job).then(response => response.success);
  }

  forceSync(jobId: JobId, date: number, mode: ForceMode): Promise<boolean> {
    return this.jobRepository.forceSync(jobId, date, mode).then(response => response.success);
  }

  multiForceSync(jobIds: JobId[], date: number, mode: ForceMode): Promise<Record<JobId, boolean>> {
    return this.jobRepository.multiForceSync(jobIds, date, mode);
  }

  cancel(jobId: JobId): Promise<boolean> {
    return this.jobRepository.cancel(jobId).then(response => response.success);
  }

  multiCreate(request: Job, tables: string[]): Promise<boolean> {
    return this.jobRepository.multiCreate(request, tables);
  }

  multiCreateV2(jobs: Job[]): Promise<boolean> {
    return this.jobRepository.multiCreateV2(jobs);
  }
}
