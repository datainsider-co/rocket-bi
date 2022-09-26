import { BaseModule } from '@core/modules';
import { Container, Scope } from 'typescript-ioc';
import { DataCookRepository, DataCookRepositoryImpl, DataCookShareRepository, DataCookShareRepositoryImpl } from '../Repository';
import { DataCookService, DataCookServiceImpl, DataCookShareService, DataCookShareServiceImpl } from '../Service';

export class DataCookModule extends BaseModule {
  configuration() {
    Container.bind(DataCookRepository)
      .to(DataCookRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(DataCookService)
      .to(DataCookServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(DataCookShareRepository)
      .to(DataCookShareRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(DataCookShareService)
      .to(DataCookShareServiceImpl)
      .scope(Scope.Singleton);
  }
}
