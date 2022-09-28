import { BaseModule } from '@core/modules';
import { Container, Scope } from 'typescript-ioc';
import {
  ActivityRepository,
  ActivityRepositoryImpl,
  APIKeyRepository,
  APIKeyRepositoryImpl,
  OrganizationPermissionRepository,
  OrganizationPermissionRepositoryImpl,
  OrganizationRepository,
  OrganizationRepositoryImpl
} from '@core/Organization/Repository';
import { OrganizationService, OrganizationServiceImpl } from '@core/Organization/Service/OrganizationService';
import {
  ActivityService,
  ActivityServiceImpl,
  APIKeyService,
  APIKeyServiceImpl,
  MockOrganizationPermissionService,
  OrganizationPermissionService,
  OrganizationPermissionServiceImpl
} from '@core/Organization';

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

    Container.bind(OrganizationPermissionRepository)
      .to(OrganizationPermissionRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(OrganizationPermissionService)
      .to(MockOrganizationPermissionService)
      .scope(Scope.Singleton);
  }
}
