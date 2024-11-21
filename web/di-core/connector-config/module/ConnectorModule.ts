import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import { ConnectorRepository, ConnectorRepositoryImpl, ConnectorService, ConnectorServiceImpl } from '@core/connector-config';

export class ConnectorModule extends BaseModule {
  configuration() {
    Container.bind(ConnectorRepository)
      .to(ConnectorRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(ConnectorService)
      .to(ConnectorServiceImpl)
      .scope(Scope.Singleton);
  }
}
