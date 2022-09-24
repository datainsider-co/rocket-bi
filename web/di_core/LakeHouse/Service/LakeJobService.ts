import { Inject } from 'typescript-ioc';
import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';
import { JobId } from '@core/domain';
import { ListingResponse } from '@core/DataIngestion';
import { LakeJobRepository } from '@core/LakeHouse/Repository/LakeJobRepository';
import { LakeJobResponse } from '@core/LakeHouse/Domain/LakeJob/LakeJobResponse';
import { LakeJobHistory } from '@core/LakeHouse/Domain/LakeJob/LakeJobHistory';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';
import { ForceMode } from '@core/LakeHouse/Domain/LakeJob/ForceMode';

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
