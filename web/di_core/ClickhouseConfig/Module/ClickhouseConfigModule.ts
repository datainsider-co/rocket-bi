import { BaseModule } from '@core/modules';
import { Container, Scope } from 'typescript-ioc';
import { ClickhouseConfigRepository, ClickhouseConfigRepositoryImpl, ClickhouseConfigService, ClickhouseConfigServiceImpl } from '@core/ClickhouseConfig';

export class ClickhouseConfigModule extends BaseModule {
  configuration() {
    Container.bind(ClickhouseConfigRepository)
      .to(ClickhouseConfigRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(ClickhouseConfigService)
      .to(ClickhouseConfigServiceImpl)
      .scope(Scope.Singleton);
  }
}
