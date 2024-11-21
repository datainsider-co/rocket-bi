/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 3:00 PM
 */

import { ListingRequest } from '@core/common/domain';

export class ListingResponse<ListingData> {
  data: ListingData[];
  total: number;
  constructor(data: ListingData[], total: number) {
    this.data = data;
    this.total = total;
  }
}

import { JobHistory } from '@core/data-ingestion';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';

export abstract class JobHistoryRepository {
  abstract list(request: ListingRequest): Promise<ListingResponse<JobHistory>>;
}

export class JobHistoryRepositoryImpl implements JobHistoryRepository {
  @InjectValue(DIKeys.SchedulerClient)
  private readonly httpClient!: BaseClient;

  list(request: ListingRequest): Promise<ListingResponse<JobHistory>> {
    return this.httpClient.post<ListingResponse<JobHistory>>(`history/list`, request);
  }
}
