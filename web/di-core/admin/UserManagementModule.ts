import { UserAdminService, UserAdminServiceImpl } from '@core/admin/service/UserAdminService';
import { UserAdminRepository, UserAdminRepositoryImpl } from '@core/admin/repository/UserAdminRepository';
import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import { PermissionAdminRepository, PermissionAdminRepositoryImpl } from '@core/admin/repository/PermissionAdminRepository';
import { PermissionAdminService, PermissionAdminServiceImpl } from '@core/admin/service/PermissionAdminService';
import { AdminSettingRepository, AdminSettingRepositoryIml } from '@core/admin/repository/AdminSettingRepository';
import { AdminSettingService, AdminSettingServiceIml } from '@core/admin/service/AdminSettingService';

export class UserManagementModule extends BaseModule {
  configuration(): void {
    Container.bind(PermissionAdminRepository)
      .to(PermissionAdminRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(PermissionAdminService)
      .to(PermissionAdminServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(UserAdminRepository)
      .to(UserAdminRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(UserAdminService)
      .to(UserAdminServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(AdminSettingRepository)
      .to(AdminSettingRepositoryIml)
      .scope(Scope.Singleton);

    Container.bind(AdminSettingService)
      .to(AdminSettingServiceIml)
      .scope(Scope.Singleton);
  }
}
