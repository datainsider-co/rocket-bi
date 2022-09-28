import { BaseModule } from './module';
import { Container, Scope } from 'typescript-ioc';
import { DI, DIKeys } from './di';
import {
  DashboardRepository,
  DashboardRepositoryImpl,
  DirectoryRepository,
  GeolocationRepository,
  HttpAuthenticationRepository,
  HttpDirectoryRepository,
  HttpGeolocationRepository,
  HttpPermissionToken,
  HttpUploadRepository,
  PermissionTokenRepository,
  QueryRepositoryImpl,
  UploadRepository,
  UserProfileRepository,
  UserProfileRepositoryImpl
} from '@core/repositories';
import { BaseClient } from '@core/services/base.service';
import { FunctionBuilder } from '@core/services/function_builder/function_builder';
import { FunctionResolver } from '@core/services/function_builder/function_resolver';
import { ConditionBuilder } from '@core/services/condition_builder/condition_builder';
import { DiConditionResolver, MainConditionBuilder } from '@core/services/condition_builder';
import { ConditionResolver } from '@core/services/condition_builder/condition_resolver';
import { Profiler } from '@/shared/profiler/profiler';
import { InMemoryProfiler } from '@/shared/profiler/in_mem_profiler';
import { QueryProfileBuilder } from '@core/services/query_profile_builder/query_profile.builder';
import {
  AuthenticationServiceImpl,
  CookieManger,
  CookieMangerImpl,
  DashboardService,
  DashboardServiceImpl,
  DataManager,
  DiFunctionResolver,
  DirectoryService,
  DirectoryServiceImpl,
  GeolocationService,
  GeolocationServiceImpl,
  MainFunctionBuilder,
  PermissionTokenImpl,
  PermissionTokenService,
  QueryProfileBuilderImpl,
  QueryService,
  QueryServiceImpl,
  UploadService,
  UploadServiceImpl,
  UserProfileService,
  UserProfileServiceImpl
} from '@core/services';
import { HttpPermissionRepository, PermissionRepository } from '../repositories/permission.repository';
import { PermissionService, PermissionServiceImpl } from '../services/permission.service';

export class DevModule extends BaseModule {
  configuration(): void {
    Container.bindName(DIKeys.Profiler).to(this.buildProfiler());

    Container.bind(DashboardRepository)
      .to(DashboardRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(DashboardService)
      .to(DashboardServiceImpl)
      .scope(Scope.Singleton);
    Container.bind(DirectoryRepository)
      .to(HttpDirectoryRepository)
      .scope(Scope.Singleton);
    Container.bind(DirectoryService)
      .to(DirectoryServiceImpl)
      .scope(Scope.Singleton);
    Container.bind(UploadRepository)
      .to(HttpUploadRepository)
      .scope(Scope.Singleton);
    Container.bind(UploadService)
      .to(UploadServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(PermissionRepository)
      .to(HttpPermissionRepository)
      .scope(Scope.Singleton);
    Container.bind(PermissionService)
      .to(PermissionServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(PermissionTokenRepository)
      .to(HttpPermissionToken)
      .scope(Scope.Singleton);
    Container.bind(PermissionTokenService)
      .to(PermissionTokenImpl)
      .scope(Scope.Singleton);

    Container.bindName(DIKeys.NoAuthService).to(this.buildNoAuthenticationService());
    Container.bindName(DIKeys.AuthService).to(this.buildAuthenticationService());

    Container.bind(CookieManger)
      .to(CookieMangerImpl)
      .scope(Scope.Singleton);
    Container.bind(DataManager)
      .to(DataManager)
      .scope(Scope.Singleton);

    Container.bind(FunctionBuilder)
      .to(MainFunctionBuilder)
      .scope(Scope.Singleton);
    Container.bind(FunctionResolver)
      .to(DiFunctionResolver)
      .scope(Scope.Singleton);

    Container.bind(ConditionBuilder)
      .to(MainConditionBuilder)
      .scope(Scope.Singleton);

    Container.bind(ConditionResolver)
      .to(DiConditionResolver)
      .scope(Scope.Singleton);

    Container.bind(QueryProfileBuilder)
      .to(QueryProfileBuilderImpl)
      .scope(Scope.Singleton);
    this.bindQueryService();
    Container.bind(GeolocationRepository)
      .to(HttpGeolocationRepository)
      .scope(Scope.Singleton);
    Container.bind(GeolocationService)
      .to(GeolocationServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(UserProfileRepository)
      .to(UserProfileRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(UserProfileService)
      .to(UserProfileServiceImpl)
      .scope(Scope.Singleton);
  }

  buildProfiler(): Profiler {
    const profiler = new InMemoryProfiler();
    if (process.env.VUE_APP_PROFILER_ENABLED ?? false) {
      profiler.start();
    }
    return profiler as Profiler;
  }

  buildNoAuthenticationService() {
    // fixme: check again
    const caasClient = DI.get<BaseClient>(DIKeys.CaasClient);
    const authenticationRepository = new HttpAuthenticationRepository(caasClient);
    return new AuthenticationServiceImpl(authenticationRepository);
  }

  buildAuthenticationService() {
    const caasClient = DI.get<BaseClient>(DIKeys.CaasClient);
    const authenticationRepository = new HttpAuthenticationRepository(caasClient);
    return new AuthenticationServiceImpl(authenticationRepository);
  }

  private bindQueryService() {
    const client = DI.get<BaseClient>(DIKeys.BiClient);
    const queryRepository = new QueryRepositoryImpl(client);
    const queryService = new QueryServiceImpl(queryRepository);
    Container.bind(QueryService)
      .factory(() => queryService)
      .scope(Scope.Singleton);
  }
}
