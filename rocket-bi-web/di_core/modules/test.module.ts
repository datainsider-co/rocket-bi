/*
 * @author: tvc12 - Thien Vi
 * @created: 12/9/20, 4:45 PM
 */

import { Container, Scope } from 'typescript-ioc';
import { DIKeys } from '@core/modules/di';
import {
  DashboardRepository,
  DirectoryRepository,
  DashboardRepositoryImpl,
  HttpDirectoryRepository,
  HttpPermissionToken,
  HttpUploadRepository,
  PermissionTokenRepository,
  UploadRepository
} from '@core/repositories';
import {
  CookieManger,
  CookieMangerImpl,
  DashboardService,
  DashboardServiceImpl,
  DataManager,
  DirectoryService,
  DirectoryServiceImpl,
  PermissionTokenImpl,
  PermissionTokenService,
  UploadService,
  UploadServiceImpl
} from '@core/services';
import { DevModule } from '@core/modules/dev.module';

export class TestModule extends DevModule {
  configuration(): void {
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

    Container.bind(PermissionTokenRepository)
      .to(HttpPermissionToken)
      .scope(Scope.Singleton);
    Container.bind(PermissionTokenService)
      .to(PermissionTokenImpl)
      .scope(Scope.Singleton);

    Container.bindName(DIKeys.NoAuthService).to(this.buildNoAuthenticationService());
    Container.bindName(DIKeys.AuthService).to(this.buildNoAuthenticationService());

    Container.bind(CookieManger)
      .to(CookieMangerImpl)
      .scope(Scope.Singleton);
    Container.bind(DataManager)
      .to(DataManager)
      .scope(Scope.Singleton);
  }
}
