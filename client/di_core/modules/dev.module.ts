import { BaseModule } from './module';
import { Container, Scope } from 'typescript-ioc';
import { DI, DIKeys } from './di';
import {
  DashboardRepository,
  DirectoryRepository,
  GeolocationRepository,
  HttpAuthenticationRepository,
  DashboardRepositoryImpl,
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
import { ClientBuilders, ClientWithoutWorkerBuilders } from '@core/misc/client_builder';
import { HttpPermissionRepository, PermissionRepository } from '../repositories/permission.repository';
import { PermissionService, PermissionServiceImpl } from '../services/permission.service';
import { Log } from '@core/utils';

export class HttpModule extends BaseModule {
  configuration(): void {
    switch (process.env.NODE_ENV) {
      case 'production':
        Container.bindName(DIKeys.apiHost).to('/api');
        Container.bindName(DIKeys.staticHost).to('/static');
        Container.bindName(DIKeys.lakeApiHost).to('/api/lake');
        break;
      default:
        Container.bindName(DIKeys.apiHost).to('http://dev.datainsider.co/api');
        Container.bindName(DIKeys.lakeApiHost).to('http://dev.datainsider.co/api/lake');
        Container.bindName(DIKeys.staticHost).to(process.env.VUE_APP_STATIC_HOST);
    }

    Container.bindName(DIKeys.noAuthClient).to(this.buildNoAuthClient());
    Container.bindName(DIKeys.authClient).to(this.buildAuthClient());
    Container.bindName(DIKeys.guest).to(this.buildGuestClient());
    Container.bindName(DIKeys.LakeHouseClient).to(this.buildLakeHouseClient());
  }

  buildNoAuthClient(): BaseClient {
    return ClientBuilders.defaultBuilder()
      .withBaseUrl(Container.getValue(DIKeys.apiHost))
      .withTimeout((process.env.VUE_APP_TIME_OUT as any) || 30000)
      .build();
  }

  buildAuthClient(): BaseClient {
    const apiHost = Container.getValue(DIKeys.apiHost);
    Log.debug('DevModule::', 'buildAuthClient:: with API HOST:', apiHost);
    return ClientBuilders.authAndTokenBuilder()
      .withBaseUrl(apiHost)
      .withTimeout((process.env.VUE_APP_TIME_OUT as any) || 30000)
      .build();
  }

  buildGuestClient(): BaseClient {
    const apiHost = Container.getValue(DIKeys.apiHost);
    Log.debug('DevModule::', 'buildGuestClient:: with API HOST:', apiHost);
    return ClientBuilders.authBuilder()
      .withBaseUrl(apiHost)
      .withTimeout((process.env.VUE_APP_TIME_OUT as any) || 30000)
      .build();
  }

  buildLakeHouseClient(): BaseClient {
    const apiHost = Container.getValue(DIKeys.lakeApiHost);
    Log.debug('DevModule::', 'buildLakeHouseClient:: with API HOST:', apiHost);
    return ClientBuilders.lakeHouseBuilder()
      .withBaseUrl(apiHost)
      .withTimeout((process.env.VUE_APP_TIME_OUT as any) || 30000)
      .build();
  }
}

export class TestHttpModule extends BaseModule {
  configuration(): void {
    Container.bindName(DIKeys.apiHost).to('https://dev.datainsider.co/api');
    Container.bindName(DIKeys.apiHost).to('https://explorer.datainsider.co/api');
    Container.bindName(DIKeys.staticHost).to(process.env.VUE_APP_STATIC_HOST);

    Container.bindName(DIKeys.noAuthClient).to(this.buildNoAuthClient());
    Container.bindName(DIKeys.authClient).to(this.buildAuthClient());
    Container.bindName(DIKeys.guest).to(this.buildGuestClient());
  }

  buildNoAuthClient(): BaseClient {
    return ClientWithoutWorkerBuilders.defaultBuilder()
      .withBaseUrl(Container.getValue(DIKeys.apiHost))
      .withTimeout((process.env.VUE_APP_TIME_OUT as any) || 30000)
      .build();
  }

  buildAuthClient(): BaseClient {
    const apiHost = Container.getValue(DIKeys.apiHost);
    Log.debug('DevModule::', 'buildAuthClient:: with API HOST:', apiHost);
    return ClientWithoutWorkerBuilders.authAndTokenBuilder()
      .withBaseUrl(apiHost)
      .withTimeout((process.env.VUE_APP_TIME_OUT as any) || 30000)
      .build();
  }

  buildGuestClient(): BaseClient {
    const apiHost = Container.getValue(DIKeys.apiHost);
    Log.debug('DevModule::', 'buildGuestClient:: with API HOST:', apiHost);
    return ClientWithoutWorkerBuilders.authBuilder()
      .withBaseUrl(apiHost)
      .withTimeout((process.env.VUE_APP_TIME_OUT as any) || 30000)
      .build();
  }
}

export class DevModule extends BaseModule {
  configuration(): void {
    Container.bindName(DIKeys.profiler).to(this.buildProfiler());

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

    Container.bindName(DIKeys.noAuthService).to(this.buildNoAuthenticationService());
    Container.bindName(DIKeys.authService).to(this.buildAuthenticationService());
    Container.bindName(DIKeys.guestService).to(this.buildGuestService());

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
    const noAuthClient = DI.get<BaseClient>(DIKeys.noAuthClient);
    const authenticationRepository = new HttpAuthenticationRepository(noAuthClient);
    return new AuthenticationServiceImpl(authenticationRepository);
  }

  buildAuthenticationService() {
    const authClient = DI.get<BaseClient>(DIKeys.authClient);
    const authenticationRepository = new HttpAuthenticationRepository(authClient);
    return new AuthenticationServiceImpl(authenticationRepository);
  }

  buildGuestService() {
    const guest = DI.get<BaseClient>(DIKeys.guest);
    const authenticationRepository = new HttpAuthenticationRepository(guest);
    return new AuthenticationServiceImpl(authenticationRepository);
  }

  private bindQueryService() {
    const client = DI.get<BaseClient>(DIKeys.authClient);
    const queryRepository = new QueryRepositoryImpl(client);
    const queryService = new QueryServiceImpl(queryRepository);
    Container.bind(QueryService)
      .factory(() => queryService)
      .scope(Scope.Singleton);
  }
}
