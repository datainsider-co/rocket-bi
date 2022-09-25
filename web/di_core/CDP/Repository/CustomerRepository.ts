/*
 * @author: tvc12 - Thien Vi
 * @created: 4/6/22, 11:27 AM
 */

import { PageResult } from '@core/domain';
import { CustomerEvent, CustomerInfo, ListActivitiesRequest, ListCustomerRequest, UpdateCustomerRequest } from '@core/CDP';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';

export abstract class CustomerRepository {
  abstract list(request: ListCustomerRequest): Promise<PageResult<CustomerInfo>>;

  abstract get(id: string): Promise<CustomerInfo>;

  abstract update(request: UpdateCustomerRequest): Promise<CustomerInfo>;

  abstract listActivities(request: ListActivitiesRequest): Promise<PageResult<CustomerEvent>>;
}

export class CustomerRepositoryImpl extends CustomerRepository {
  @InjectValue(DIKeys.authClient)
  private readonly httpClient!: BaseClient;

  get(id: string): Promise<CustomerInfo> {
    return this.httpClient.get(`/cdp/customers/${id}`).then(response => CustomerInfo.fromObject(response));
  }

  list(request: ListCustomerRequest): Promise<PageResult<CustomerInfo>> {
    return this.httpClient.post<PageResult<CustomerInfo>>('/cdp/customers/list', request).then(pageResult => {
      const customers = pageResult.data.map(customer => CustomerInfo.fromObject(customer));
      return new PageResult<CustomerInfo>(customers, pageResult.total);
    });
  }

  listActivities(request: ListActivitiesRequest): Promise<PageResult<CustomerEvent>> {
    return this.httpClient.post<PageResult<CustomerEvent>>(`/cdp/customers/${request.id}/activities`, request).then(response => {
      const activities = response.data.map(activity => CustomerEvent.fromObject(activity));
      return new PageResult(activities, response.total);
    });
  }

  update(request: UpdateCustomerRequest): Promise<CustomerInfo> {
    return Promise.reject(undefined);
  }
}
