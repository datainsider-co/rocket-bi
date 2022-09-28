import { Inject } from 'typescript-ioc';
import { PermissionAdminRepository } from '@core/admin/repository/PermissionAdminRepository';
import { ChangePermissionRequest } from '@core/admin/domain/request/ChangePermissionRequest';
import { IsPermittedPermissionRequest } from '@core/admin/domain/request/IsPermittedPermissionRequest';
import { PermissionGroup, SupportPermissionGroups } from '@core/admin/domain/permissions/PermissionGroup';
import { PermittedResponse } from '@core/domain/Response/ResouceSharing/PermittedResponse';

export abstract class PermissionAdminService {
  abstract getAllPermissions(username: string): Promise<string[]>;

  abstract changePermissions(request: ChangePermissionRequest): Promise<boolean>;

  abstract isPermitted(request: IsPermittedPermissionRequest): Promise<PermittedResponse>;

  abstract getSupportPermissionGroups(): Promise<PermissionGroup[]>;

  abstract getPermittedPermissions(username: string, permissions: string[]): Promise<string[]>;
}

export class PermissionAdminServiceImpl implements PermissionAdminService {
  @Inject
  permissionRepository!: PermissionAdminRepository;

  getSupportPermissionGroups(): Promise<PermissionGroup[]> {
    return Promise.resolve([
      SupportPermissionGroups.organization(),
      SupportPermissionGroups.user(),
      SupportPermissionGroups.billing(),
      SupportPermissionGroups.dataSourceIngestion(),
      SupportPermissionGroups.jobIngestion(),
      SupportPermissionGroups.dataWarehouse(),
      SupportPermissionGroups.insights(),
      SupportPermissionGroups.dataCook(),
      SupportPermissionGroups.dataLake(),
      SupportPermissionGroups.CDP(),
      SupportPermissionGroups.APIKey()
    ]);
  }

  changePermissions(request: ChangePermissionRequest): Promise<boolean> {
    return this.permissionRepository.changePermissions(request);
  }

  getAllPermissions(username: string): Promise<string[]> {
    return this.permissionRepository.getAllPermissions(username);
  }

  isPermitted(request: IsPermittedPermissionRequest): Promise<PermittedResponse> {
    return this.permissionRepository.isPermitted(request);
  }

  getPermittedPermissions(username: string, permissions: string[]): Promise<string[]> {
    return this.isPermitted(new IsPermittedPermissionRequest(username, permissions)).then(permittedMap =>
      this.buildSelectedPermissions(permissions, permittedMap)
    );
  }

  private buildSelectedPermissions(permissions: string[], permittedMap: PermittedResponse): string[] {
    const result: string[] = [];
    permissions.forEach(permission => {
      if (permission && permittedMap[permission]) {
        result.push(permission);
      }
    });
    return result;
  }
}
