import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import { ClickhouseConfigRepository, ClickhouseConfigRepositoryImpl, ClickhouseConfigService, ClickhouseConfigServiceImpl } from '@core/clickhouse-config';

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
