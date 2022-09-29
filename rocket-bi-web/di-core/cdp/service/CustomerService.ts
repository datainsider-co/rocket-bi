/*
 * @author: tvc12 - Thien Vi
 * @created: 4/6/22, 11:27 AM
 */

import { PageResult } from '@core/common/domain';
import { CustomerEvent, CustomerInfo, ListActivitiesRequest, ListCustomerRequest, UpdateCustomerRequest } from '@core/cdp';
import { Inject } from 'typescript-ioc';
import { CustomerRepository } from '@core/cdp/repository/CustomerRepository';

export abstract class CustomerService {
  abstract list(request: ListCustomerRequest): Promise<PageResult<CustomerInfo>>;

  abstract get(id: string): Promise<CustomerInfo>;

  abstract update(request: UpdateCustomerRequest): Promise<CustomerInfo>;

  abstract listActivities(request: ListActivitiesRequest): Promise<PageResult<CustomerEvent>>;
}

export class CustomerServiceImpl extends CustomerService {
  @Inject
  private readonly repository!: CustomerRepository;

  get(id: string): Promise<CustomerInfo> {
    return this.repository.get(id);
  }

  list(request: ListCustomerRequest): Promise<PageResult<CustomerInfo>> {
    return this.repository.list(request);
  }

  listActivities(request: ListActivitiesRequest): Promise<PageResult<CustomerEvent>> {
    return this.repository.listActivities(request);
  }

  update(request: UpdateCustomerRequest): Promise<CustomerInfo> {
    return this.repository.update(request);
  }
}
