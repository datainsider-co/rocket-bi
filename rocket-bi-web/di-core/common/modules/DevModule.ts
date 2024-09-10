import { BaseModule } from './Module';
import { Container, Scope } from 'typescript-ioc';
import { Di, DIKeys } from './Di';
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
} from '@core/common/repositories';
import { BaseClient } from '@core/common/services/HttpClient';
import { FunctionBuilder } from '@core/common/services/function-builder/FunctionBuilder';
import { FunctionResolver } from '@core/common/services/function-builder/FunctionResolver';
import { ConditionBuilder } from '@core/common/services/condition-builder/ConditionBuilder';
import { DiConditionResolver, MainConditionBuilder } from '@core/common/services/condition-builder';
import { ConditionResolver } from '@core/common/services/condition-builder/ConditionResolver';
import { Profiler } from '@/shared/profiler/Profiler';
import { InMemoryProfiler } from '@/shared/profiler/InMemoryProfiler';
import { QueryProfileBuilder } from '@core/common/services/query-profile-builder/QueryProfileBuilder';
import {
  AuthenticationServiceImpl,
  CookieManger,
  CookieMangerImpl,
  DashboardService,
  DashboardServiceImpl,
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
} from '@core/common/services';
import { HttpPermissionRepository, PermissionRepository } from '../repositories/PermissionRepository';
import { PermissionService, PermissionServiceImpl } from '../services/PermissionService';
import { ImageService, ImageServiceImpl } from '@core/common/services/ImageService';
import { ImageRepository, ImageRepositoryImpl } from '@core/common/repositories/ImageRepository';
import { ChatbotController, OpenAiController } from '@/shared/components/chat/controller/ChatbotController';
import { SummarizeFunction } from '@/shared/components/chat/controller/functions/SummarizeFunction';
import { SortedFunction } from '@/shared/components/chat/controller/functions/SortedFunction';

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

    Container.bind(ImageRepository)
      .to(ImageRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(ImageService)
      .to(ImageServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(ChatbotController)
      .to(OpenAiController)
      .scope(Scope.Singleton);

    this.buildSortedFunction();
    this.buildSummarizeFunction();
  }

  buildProfiler(): Profiler {
    const profiler = new InMemoryProfiler();
    if (window.appConfig.VUE_APP_PROFILER_ENABLED ?? false) {
      profiler.start();
    }
    return profiler as Profiler;
  }

  buildNoAuthenticationService() {
    // fixme: check again
    const caasClient = Di.get<BaseClient>(DIKeys.CaasClient);
    const authenticationRepository = new HttpAuthenticationRepository(caasClient);
    return new AuthenticationServiceImpl(authenticationRepository);
  }

  buildAuthenticationService() {
    const caasClient = Di.get<BaseClient>(DIKeys.CaasClient);
    const authenticationRepository = new HttpAuthenticationRepository(caasClient);
    return new AuthenticationServiceImpl(authenticationRepository);
  }

  buildSummarizeFunction() {
    const chatbotController = Di.get(ChatbotController);
    const fnc = new SummarizeFunction(chatbotController);
    Container.bind(SummarizeFunction)
      .factory(() => fnc)
      .scope(Scope.Singleton);
  }

  buildSortedFunction() {
    const chatbotController = Di.get(ChatbotController);
    Container.bind(SortedFunction)
      .factory(() => new SortedFunction(chatbotController))
      .scope(Scope.Singleton);
  }

  private bindQueryService() {
    const client = Di.get<BaseClient>(DIKeys.BiClient);
    const queryRepository = new QueryRepositoryImpl(client);
    const queryService = new QueryServiceImpl(queryRepository);
    Container.bind(QueryService)
      .factory(() => queryService)
      .scope(Scope.Singleton);
  }
}
