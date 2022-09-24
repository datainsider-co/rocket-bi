/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:00 PM
 */

import { JobHistory, ListingResponse } from '@core/DataIngestion';
import { JobHistoryRepository } from '@core/DataIngestion/Repository/JobHistoryRepository';
import { Inject } from 'typescript-ioc';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';

export abstract class JobHistoryService {
  abstract list(request: ListingRequest): Promise<ListingResponse<JobHistory>>;
}

export class JobHistoryServiceImpl implements JobHistoryService {
  @Inject
  private readonly historyRepository!: JobHistoryRepository;

  list(request: ListingRequest): Promise<ListingResponse<JobHistory>> {
    return this.historyRepository.list(request);
  }
}
