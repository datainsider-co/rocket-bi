import { Properties } from 'di-web-analytics/dist/domain';

export enum WidgetAction {
  View = 'view',
  Create = 'create',
  Edit = 'edit',
  Duplicate = 'duplicate',
  Delete = 'delete'
}

export enum DashboardAction {
  View = 'view_dashboard',
  Create = 'create_dashboard',
  Edit = 'edit_dashboard',
  Rename = 'rename_dashboard',
  Delete = 'delete_dashboard'
}

export enum DirectoryAction {
  View = 'view_directory',
  Create = 'create_directory',
  Edit = 'edit_directory',
  Rename = 'rename_directory',
  Delete = 'delete_directory',
  Move = 'move_directory',
  Star = 'star_directory',
  RemoveStar = 'remove_star_directory',
  Restore = 'restore_directory',
  HardDelete = 'hard_delete_directory'
}

export interface DirectoryTrackingData {
  action: DirectoryAction;
  directoryId: number;
  parentDirectoryId?: number;
  directoryName?: string;
  isError?: boolean;
  extraProperties?: Properties;
}

export interface DashboardTrackingData {
  action: DashboardAction;
  dashboardId: number;
  dashboardName?: string;
  isError?: boolean;
  extraProperties?: Properties;
}

export interface WidgetTrackingData {
  action: WidgetAction;
  widgetType?: string;
  widgetId?: number;
  widgetName?: string;
  chartType?: string;
  dashboardId?: number;
  dashboardName?: string;
  isError?: boolean;
  extraProperties?: Properties;
}
