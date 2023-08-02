import { DirectoryPermissionProviderImpl } from '@core/admin/domain/permissions/DirectoryProvider';
import { PermsPermissionProviderImpl } from '@core/admin/domain/permissions/PermProvider';
import { UserPermissionProviderImpl } from '@core/admin/domain/permissions/UserProvider';
import { SettingPermissionProviderImpl } from './SettingProvider';
import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import { DatabasePermissionProviderImpl } from '@core/admin/domain/permissions/DatabaseProvider';

export class PermissionProviders {
  static permission(organizationId: string) {
    return new PermsPermissionProviderImpl(organizationId);
  }

  static user(organizationId: string) {
    return new UserPermissionProviderImpl(organizationId);
  }

  static directory(organizationId: string) {
    return new DirectoryPermissionProviderImpl(organizationId);
  }

  // static dashboard() {
  //   return new DashboardPermissionProviderImpl();
  // }

  // static widget() {
  //   return new WidgetPermissionProviderImpl();
  // }

  static setting(organizationId: string) {
    return new SettingPermissionProviderImpl(organizationId);
  }

  static database(organizationId: string) {
    return new DatabasePermissionProviderImpl(organizationId);
  }

  static buildPermissionsFromActions(organizationId: string, resourceType: string, resourceId: string, actions: string[]): string[] {
    return actions.map(action => this.buildPermission(organizationId, resourceType, action, resourceId));
  }

  static buildPermission(organizationId: string, resourceType: string, action: string, resourceId: string): string {
    return `${organizationId}:${resourceType}:${action}:${resourceId}`;
  }

  //todo: check if add share permission
  static getActionType(organizationId: string, resourceType: ResourceType, resourceId: string, permissions: string[]): ActionType {
    const editPermission = PermissionProviders.buildPermission(organizationId, resourceType, ActionType.edit, resourceId);
    const downloadPermission = PermissionProviders.buildPermission(organizationId, resourceType, ActionType.download, resourceId);
    const viewPermission = PermissionProviders.buildPermission(organizationId, resourceType, ActionType.view, resourceId);
    if (permissions.includes(editPermission)) {
      return ActionType.edit;
    } else if (permissions.includes(downloadPermission) && permissions.includes(viewPermission)) {
      return ActionType.viewAndDownLoad;
    } else if (permissions.includes(viewPermission)) {
      return ActionType.view;
    } else {
      return ActionType.none;
    }
  }
}
