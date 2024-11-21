/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:00 PM
 */

import { JobHistory, ListingResponse } from '@core/data-ingestion';
import { JobHistoryRepository } from '@core/data-ingestion/repository/JobHistoryRepository';
import { Inject } from 'typescript-ioc';
import { ListingRequest } from '@core/common/domain';

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
