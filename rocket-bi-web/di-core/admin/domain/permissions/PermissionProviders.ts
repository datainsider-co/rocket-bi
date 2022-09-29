import { DirectoryPermissionProviderImpl } from '@core/admin/domain/permissions/DirectoryProvider';
import { PermsPermissionProviderImpl } from '@core/admin/domain/permissions/PermProvider';
import { UserPermissionProviderImpl } from '@core/admin/domain/permissions/UserProvider';
import { WidgetPermissionProviderImpl } from '@core/admin/domain/permissions/WidgetProvider';
import { DashboardPermissionProviderImpl } from '@core/admin/domain/permissions/DashboardProvider';
import { SettingPermissionProviderImpl } from './SettingProvider';
import { PERMISSION_ACTION_NODES, ActionType, ResourceType } from '@/utils/PermissionUtils';
import { ActionNode } from '@/shared';
import { Log } from '@core/utils';
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

  static isPermittedAll(organizationId: string, resourceType: ResourceType, resourceId: string, actions: string[], permissions: string[]): boolean {
    const perms = PermissionProviders.buildPermissionsFromActions(organizationId, resourceType, resourceId, actions);
    return !perms.some((permission: string) => !permissions.includes(permission));
  }

  static getActionType(organizationId: string, resourceType: ResourceType, resourceId: string, permissions: string[]): ActionType {
    const actionNodes: ActionNode[] = PERMISSION_ACTION_NODES;
    Log.debug('ActionNode::', actionNodes);
    const actionNode: ActionNode | undefined = actionNodes.find(actionNode =>
      this.isPermittedAll(organizationId, resourceType, resourceId, actionNode.actions, permissions)
    );
    if (actionNode) {
      return actionNode.type;
    } else {
      return ActionType.none;
    }
  }
}
