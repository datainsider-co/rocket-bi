import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import { DataCookRepository, DataCookRepositoryImpl, DataCookShareRepository, DataCookShareRepositoryImpl } from '../repository';
import { DataCookService, DataCookServiceImpl, DataCookShareService, DataCookShareServiceImpl } from '../service';

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
