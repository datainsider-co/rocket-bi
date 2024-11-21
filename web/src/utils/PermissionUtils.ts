import { ActionNode } from '@/shared';

export enum ActionType {
  none = 'none',
  view = 'view',
  download = 'download',
  //fake type in ui
  viewAndDownLoad = 'view_and_download',
  edit = 'edit',
  create = 'create',
  delete = 'delete',
  copy = 'copy',
  all = '*'
}

export const ActionTypeMapActions: Record<ActionType, ActionType[]> = {
  [ActionType.all]: [ActionType.all, ActionType.view, ActionType.download, ActionType.edit, ActionType.copy, ActionType.delete, ActionType.create],
  [ActionType.edit]: [ActionType.view, ActionType.download, ActionType.edit, ActionType.copy, ActionType.delete, ActionType.create],
  [ActionType.viewAndDownLoad]: [ActionType.view, ActionType.download],
  [ActionType.view]: [ActionType.view],
  [ActionType.download]: [ActionType.download],
  [ActionType.create]: [ActionType.create],
  [ActionType.copy]: [ActionType.copy],
  [ActionType.delete]: [ActionType.delete],
  [ActionType.create]: [ActionType.create],
  [ActionType.none]: []
};

//todo: sort highest permission to lowest permission
export const PERMISSION_ACTION_NODES: ActionNode[] = [
  { label: 'Edit', type: ActionType.edit, actions: ActionTypeMapActions[ActionType.edit] },
  { label: 'View & Download', type: ActionType.viewAndDownLoad, actions: ActionTypeMapActions[ActionType.viewAndDownLoad] },
  { label: 'View', type: ActionType.view, actions: ActionTypeMapActions[ActionType.view] },
  { label: 'Remove access', type: ActionType.none, actions: ActionTypeMapActions[ActionType.none] }
];

export enum ResourceType {
  dashboard = 'dashboard',
  query = 'queries',
  directory = 'directory',
  widget = 'widget',
  database = 'database',
  etl = 'etl'
}
