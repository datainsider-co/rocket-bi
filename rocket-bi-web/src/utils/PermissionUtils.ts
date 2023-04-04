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
  query = 'queries',
  directory = 'directory',
  widget = 'widget',
  database = 'database',
  etl = 'etl'
}
