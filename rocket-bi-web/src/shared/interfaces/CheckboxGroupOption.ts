import { PermissionInfo } from '@core/admin/domain/permissions/PermissionGroup';

export interface CheckboxGroupOption {
  [key: string]: any;
  value: string;
  text: string;
}

export interface GroupCheckboxOption {
  groupName: string;
  allPermission: PermissionInfo;
  permissions: CheckboxGroupOption[];
}
