import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import { EventRepository, EventRepositoryImpl } from '@core/cdp/repository/EventRepository';
import { EventExplorerService, EventExplorerServiceImpl } from '@core/cdp/service/EventExploreService';
import { CustomerRepository, CustomerRepositoryImpl } from '@core/cdp/repository/CustomerRepository';
import { CustomerService, CustomerServiceImpl } from '@core/cdp/service/CustomerService';
import { CohortRepository, CohortRepositoryImpl, CohortService, CohortServiceImpl } from '@core/cdp';

export class CdpModule extends BaseModule {
  configuration() {
    Container.bind(CohortRepository)
      .to(CohortRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(CohortService)
      .to(CohortServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(EventRepository)
      .to(EventRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(EventExplorerService)
      .to(EventExplorerServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(CustomerRepository)
      .to(CustomerRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(CustomerService)
      .to(CustomerServiceImpl)
      .scope(Scope.Singleton);
  }
}
