import { BaseModule } from '@core/modules';
import { Container, Scope } from 'typescript-ioc';
import { EventRepository, EventRepositoryImpl } from '@core/CDP/Repository/EventRepository';
import { EventExplorerService, EventExplorerServiceImpl } from '@core/CDP/Service/EventExploreService';
import { CustomerRepository, CustomerRepositoryImpl } from '@core/CDP/Repository/CustomerRepository';
import { CustomerService, CustomerServiceImpl } from '@core/CDP/Service/CustomerService';
import { CohortRepository, CohortRepositoryImpl, CohortService, CohortServiceImpl } from '@core/CDP';

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
