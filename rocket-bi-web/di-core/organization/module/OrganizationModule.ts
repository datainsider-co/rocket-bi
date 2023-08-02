import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import {
  ActivityRepository,
  ActivityRepositoryImpl,
  OrganizationRepository,
  OrganizationRepositoryImpl,
  APIKeyRepository,
  APIKeyRepositoryImpl
} from '@core/organization/repository';
import { OrganizationService, OrganizationServiceImpl } from '@core/organization/service/OrganizationService';
import { ActivityService, ActivityServiceImpl, APIKeyService, APIKeyServiceImpl } from '@core/organization';

export class OrganizationModule extends BaseModule {
  configuration() {
    Container.bind(OrganizationRepository)
      .to(OrganizationRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(OrganizationService)
      .to(OrganizationServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(ActivityRepository)
      .to(ActivityRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(ActivityService)
      .to(ActivityServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(APIKeyRepository)
      .to(APIKeyRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(APIKeyService)
      .to(APIKeyServiceImpl)
      .scope(Scope.Singleton);
  }
}
