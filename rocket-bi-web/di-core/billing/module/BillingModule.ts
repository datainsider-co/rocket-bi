import { BaseModule } from '@core/common/modules';
import { Container, Scope, Singleton } from 'typescript-ioc';
import { BillingRepository, BillingRepositoryImpl, BillingService, BillingServiceImpl } from '@core/billing';

export class BillingModule extends BaseModule {
  configuration() {
    Container.bind(BillingRepository)
      .to(BillingRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(BillingService)
      .to(BillingServiceImpl)
      .scope(Scope.Singleton);
  }
}
