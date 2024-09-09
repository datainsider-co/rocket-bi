import { ListingRequest, ListingResponse } from '@core/common/domain';
import { QueryExecutionLog } from '@core/organization';
import { Inject } from 'typescript-ioc';
import { QueryUsageRepository } from '../repository/QueryUsageRepository'; //Not change it
export abstract class QueryUsageService {
  abstract search(request: ListingRequest): Promise<ListingResponse<QueryExecutionLog>>;
}

export class QueryUsageServiceImpl implements QueryUsageService {
  @Inject
  private readonly repository!: QueryUsageRepository;

  search(request: ListingRequest): Promise<ListingResponse<QueryExecutionLog>> {
    return this.repository.search(request);
  }
}
