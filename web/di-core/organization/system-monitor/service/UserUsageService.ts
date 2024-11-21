import { ListingRequest, ListingResponse } from '@core/common/domain';
import { QueryExecutionLog } from '@core/organization';
import { Inject } from 'typescript-ioc';
import { UserUsageRepository } from '../repository/UserUsageRepository'; //Not change it
export abstract class UserUsageService {
  abstract search(request: ListingRequest): Promise<ListingResponse<QueryExecutionLog>>;
}

export class UserUsageServiceImpl implements UserUsageService {
  @Inject
  private readonly repository!: UserUsageRepository;

  search(request: ListingRequest): Promise<ListingResponse<QueryExecutionLog>> {
    return this.repository.search(request);
  }
}
