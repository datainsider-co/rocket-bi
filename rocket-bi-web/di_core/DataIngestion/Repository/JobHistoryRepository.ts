/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 3:00 PM
 */

import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';

export class ListingResponse<ListingData> {
  data: ListingData[];
  total: number;
  constructor(data: ListingData[], total: number) {
    this.data = data;
    this.total = total;
  }
}

import { JobHistory } from '@core/DataIngestion';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';

export abstract class JobHistoryRepository {
  abstract list(request: ListingRequest): Promise<ListingResponse<JobHistory>>;
}

export class JobHistoryRepositoryImpl implements JobHistoryRepository {
  @InjectValue(DIKeys.SchedulerClient)
  private readonly httpClient!: BaseClient;

  list(request: ListingRequest): Promise<ListingResponse<JobHistory>> {
    return this.httpClient.post<ListingResponse<JobHistory>>(`scheduler/history/list`, request);
  }
}
