/*
 * @author: tvc12 - Thien Vi
 * @created: 12/9/20, 4:45 PM
 */

import { Container, Scope } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import {
  DashboardRepository,
  DashboardRepositoryImpl,
  DirectoryRepository,
  HttpDirectoryRepository,
  HttpPermissionToken,
  HttpUploadRepository,
  PermissionTokenRepository,
  UploadRepository
} from '@core/common/repositories';
import {
  CookieManger,
  CookieMangerImpl,
  DashboardService,
  DashboardServiceImpl,
  DirectoryService,
  DirectoryServiceImpl,
  PermissionTokenImpl,
  PermissionTokenService,
  UploadService,
  UploadServiceImpl
} from '@core/common/services';
import { DevModule } from '@core/common/modules/DevModule';
import { ImageRepository, ImageRepositoryImpl } from '@core/common/repositories/ImageRepository';
import { ImageService, ImageServiceImpl } from '@core/common/services/ImageService';

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

    Container.bind(ImageRepository)
      .to(ImageRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(ImageService)
      .to(ImageServiceImpl)
      .scope(Scope.Singleton);
  }
}
