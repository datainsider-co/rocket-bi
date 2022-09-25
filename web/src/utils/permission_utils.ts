import { ActionNode } from '@/shared';

export enum ActionType {
  none = 'none',
  view = 'view',
  edit = 'edit',
  create = 'create',
  delete = 'delete',
  copy = 'copy',
  all = '*'
}

export const editActions = [ActionType.view, ActionType.edit, ActionType.copy, ActionType.delete, ActionType.create];

//todo: sort highest permission to lowest permission
export const PERMISSION_ACTION_NODES: ActionNode[] = [
  { label: 'Editor', type: ActionType.edit, actions: editActions },
  { label: 'Viewer', type: ActionType.view, actions: [ActionType.view] },
  { label: 'Remove', type: ActionType.none, actions: [] }
];

export enum ResourceType {
  dashboard = 'dashboard',
  directory = 'directory',
  widget = 'widget',
  database = 'database',
  etl = 'etl'
}

export class PermissionUtils {
  static isPermissionViewDashboard(permissionType: ActionType): boolean {
    return permissionType == ActionType.view;
  }

  static isPermissionEditDashboard(permissionType: ActionType): boolean {
    return permissionType == ActionType.edit || permissionType == ActionType.all;
  }

  static isPermissionEditChart(permissionType: ActionType): boolean {
    return permissionType == ActionType.edit || permissionType == ActionType.all;
  }

  static isPermissionDeleteChart(permissionType: ActionType): boolean {
    return permissionType == ActionType.all;
  }

  static isPermissionCreateChart(permissionType: ActionType): boolean {
    return permissionType == ActionType.all;
  }

  static isPermissionDuplicateChart(permissionType: ActionType): boolean {
    return permissionType == ActionType.all;
  }
}
