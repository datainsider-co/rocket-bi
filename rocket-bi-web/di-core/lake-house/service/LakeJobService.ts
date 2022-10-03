import { Inject } from 'typescript-ioc';
import { LakeJob } from '@core/lake-house/domain/lake-job/LakeJob';
import { JobId } from '@core/common/domain';
import { ListingResponse } from '@core/data-ingestion';
import { LakeJobRepository } from '@core/lake-house/repository/LakeJobRepository';
import { LakeJobResponse } from '@core/lake-house/domain/lake-job/LakeJobResponse';
import { LakeJobHistory } from '@core/lake-house/domain/lake-job/LakeJobHistory';
import { ListingRequest } from '@core/lake-house/domain/request/listing-request/ListingRequest';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';

export abstract class LakeJobService {
  abstract create(job: LakeJob): Promise<LakeJob>;
  abstract get(jobId: JobId): Promise<LakeJobResponse>;
  abstract list(request: ListingRequest): Promise<ListingResponse<LakeJobResponse>>;
  abstract listHistory(request: ListingRequest): Promise<ListingResponse<LakeJobHistory>>;
  abstract delete(jobId: JobId): Promise<boolean>;
  abstract update(job: LakeJob): Promise<boolean>;
  abstract forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<boolean>;
  abstract cancel(jobId: JobId): Promise<boolean>;
}
export class LakeJobServiceImpl extends LakeJobService {
  constructor(@Inject private repository: LakeJobRepository) {
    super();
  }

  create(job: LakeJob): Promise<LakeJob> {
    return this.repository.create(job);
  }

  delete(jobId: JobId): Promise<boolean> {
    return this.repository.delete(jobId);
  }

  get(jobId: JobId): Promise<LakeJobResponse> {
    return this.repository.get(jobId);
  }

  list(request: ListingRequest): Promise<ListingResponse<LakeJobResponse>> {
    return this.repository.list(request);
  }
  listHistory(request: ListingRequest): Promise<ListingResponse<LakeJobHistory>> {
    return this.repository.listHistory(request);
  }

  update(job: LakeJob): Promise<boolean> {
    return this.repository.update(job);
  }

  forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<boolean> {
    return this.repository.forceRun(jobId, date, mode);
  }

  cancel(jobId: JobId): Promise<boolean> {
    return this.repository.cancel(jobId);
  }
}
