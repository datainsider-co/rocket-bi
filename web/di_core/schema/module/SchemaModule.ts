/*
 * @author: tvc12 - Thien Vi
 * @created: 3/30/21, 10:30 AM
 */

import { BaseModule } from '@core/modules';
import { Container, Scope } from 'typescript-ioc';
import { SchemaService, SchemaServiceImpl } from '@core/schema/service/SchemaService';
import { SchemaRepositoryImpl, SchemaRepository } from '@core/schema/repository/SchemaRepository';
import { RlsRepository, RlsRepositoryIml } from '@core/schema/repository/RlsRepository';
import { RlsService, RlsServiceIml } from '@core/schema/service/RlsService';

export class SchemaModule extends BaseModule {
  configuration(): void {
    Container.bind(SchemaRepository)
      .to(SchemaRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(SchemaService)
      .to(SchemaServiceImpl)
      .scope(Scope.Singleton);
    Container.bind(RlsRepository)
      .to(RlsRepositoryIml)
      .scope(Scope.Singleton);
    Container.bind(RlsService)
      .to(RlsServiceIml)
      .scope(Scope.Singleton);
  }
}

export class MockSchemaModule extends BaseModule {
  configuration(): void {
    // Container.bind(SchemaRepository).to(HttpSchemaRepository).scope(Scope.Singleton);
    // Container.bind(SchemaService).to(SchemaServiceImpl).scope(Scope.Singleton);
  }
}
