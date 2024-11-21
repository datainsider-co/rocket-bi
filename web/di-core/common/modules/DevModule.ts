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
import { ChartType } from '@/shared';
import { SeriesPromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/SeriesPromptGenerator';
import { NumberPromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/NumberPromptGenerator';
import { BubblePromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/BubblePromptGenerator';
import { PiePromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/PiePromptGenerator';
import { FlattenTablePromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/FlattenTablePromptGenerator';
import { MapPromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/MapPromptGenerator';
import { PivotTablePromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/PivotTablePromptGenerator';
import { ScatterPromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/ScatterPromptGenerator';
import { StackSeriesPromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/StackSeriesPromptGenerator';
import { ChartPromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/ChartPromptGenerator';
import { GroupTablePromptGenerator } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/chart-prompt-generator/impl/GroupTablePromptGenerator';
import {
  ChartPromptFactory,
  ChartPromptFactoryImpl
} from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/ChartPromptFactory';
import { ChartBuilderFunction } from '@/shared/components/chat/controller/functions/ChartBuilderFunction';

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

    this.bindChartBuilderFactory();
    this.buildChartBuilderFunction();
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

  private bindChartBuilderFactory() {
    const handlers: Map<ChartType, ChartPromptGenerator> = new Map([
      [ChartType.Area, new SeriesPromptGenerator()],
      [ChartType.Bar, new SeriesPromptGenerator()],
      [ChartType.BellCurve, new NumberPromptGenerator()],
      [ChartType.Bubble, new BubblePromptGenerator()],
      [ChartType.Bullet, new NumberPromptGenerator()],
      [ChartType.CircularBar, new SeriesPromptGenerator()],
      [ChartType.Column, new SeriesPromptGenerator()],
      [ChartType.Donut, new PiePromptGenerator()],
      [ChartType.FlattenTable, new FlattenTablePromptGenerator()],
      [ChartType.Funnel, new PiePromptGenerator()],
      [ChartType.Gauges, new NumberPromptGenerator()],
      [ChartType.Histogram, new NumberPromptGenerator()],
      [ChartType.Kpi, new NumberPromptGenerator()],
      [ChartType.Line, new SeriesPromptGenerator()],
      [ChartType.Lollipop, new SeriesPromptGenerator()],
      [ChartType.Map, new MapPromptGenerator()],
      [ChartType.Pareto, new SeriesPromptGenerator()],
      [ChartType.Parliament, new PiePromptGenerator()],
      [ChartType.Pie, new PiePromptGenerator()],
      [ChartType.PivotTable, new PivotTablePromptGenerator()],
      [ChartType.Pyramid, new PiePromptGenerator()],
      [ChartType.Scatter, new ScatterPromptGenerator()],
      [ChartType.SpiderWeb, new PiePromptGenerator()],
      [ChartType.StackedBar, new StackSeriesPromptGenerator()],
      [ChartType.StackedColumn, new StackSeriesPromptGenerator()],
      [ChartType.StackedLine, new StackSeriesPromptGenerator()],
      [ChartType.Table, new GroupTablePromptGenerator()],
      [ChartType.Variablepie, new PiePromptGenerator()],
      [ChartType.WindRose, new SeriesPromptGenerator()],
      [ChartType.WordCloud, new PiePromptGenerator()]
    ]);
    Container.bind(ChartPromptFactory)
      .factory(() => new ChartPromptFactoryImpl(handlers))
      .scope(Scope.Singleton);
  }

  private buildChartBuilderFunction() {
    const controller = Di.get(ChatbotController);
    const factory = Di.get(ChartPromptFactory);

    const fnc = new ChartBuilderFunction(controller, factory);
    Container.bind(ChartBuilderFunction)
      .factory(() => fnc)
      .scope(Scope.Singleton);
  }
}
