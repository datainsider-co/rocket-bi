/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:03 PM
 */

import { Job, JobInfo } from '@core/data-ingestion/domain/job/Job';
import { JobRepository } from '@core/data-ingestion/repository/JobRepository';
import { Inject } from 'typescript-ioc';
import { JobId } from '@core/common/domain';
import { ListingResponse } from '@core/data-ingestion';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';
import { ListingRequest } from '@core/lake-house/domain/request/listing-request/ListingRequest';

export abstract class JobService {
  abstract create(request: Job): Promise<JobInfo>;

  abstract multiCreate(request: Job, tables: string[]): Promise<boolean>;

  abstract list(request: ListingRequest): Promise<ListingResponse<JobInfo>>;

  abstract delete(id: JobId): Promise<boolean>;

  abstract update(id: JobId, job: Job): Promise<boolean>;

  abstract testConnection(job: Job): Promise<boolean>;

  abstract forceSync(jobId: JobId, date: number, mode: ForceMode): Promise<boolean>;

  abstract cancel(jobId: JobId): Promise<boolean>;
}

export class JobServiceImpl implements JobService {
  constructor(@Inject private jobRepository: JobRepository) {}

  create(request: Job): Promise<JobInfo> {
    return this.jobRepository.create(request);
  }

  delete(id: JobId): Promise<boolean> {
    return this.jobRepository.delete(id);
  }

  list(request: ListingRequest): Promise<ListingResponse<JobInfo>> {
    return this.jobRepository.list(request);
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

  cancel(jobId: JobId): Promise<boolean> {
    return this.jobRepository.cancel(jobId).then(response => response.success);
  }

  multiCreate(request: Job, tables: string[]): Promise<boolean> {
    return this.jobRepository.multiCreate(request, tables);
  }
}
